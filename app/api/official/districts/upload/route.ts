import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DataSource, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.OFFICIAL && session.role !== Role.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "No records provided for upload" },
        { status: 400 }
      );
    }

    // Cache districts by name
    const allDistricts = await prisma.district.findMany();
    const districtMap = new Map<string, string>();
    for (const d of allDistricts) {
      districtMap.set(d.name.toLowerCase(), d.id);
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];
    const seenInBatch = new Set<string>();

    for (let index = 0; index < records.length; index++) {
      const item = records[index];
      const nameKey = String(item.districtName || "").trim().toLowerCase();
      const districtId = districtMap.get(nameKey);

      if (!districtId) {
        errors.push(`Row ${index + 1}: District "${item.districtName}" not found in database.`);
        continue;
      }

      const mm = Number(item.rainfallMm);
      if (isNaN(mm)) {
        errors.push(`Row ${index + 1}: Invalid rainfall amount "${item.rainfallMm}".`);
        continue;
      }

      const recordDate = item.date ? new Date(item.date) : new Date();
      const dateStr = recordDate.toISOString().split("T")[0];
      const batchKey = `${districtId}_${dateStr}`;

      // Deduplication check within batch
      if (seenInBatch.has(batchKey)) {
        duplicateCount++;
        errors.push(`Row ${index + 1}: Duplicate entry for district "${item.districtName}" on date ${dateStr} in file. Skipped.`);
        continue;
      }
      seenInBatch.add(batchKey);

      // Deduplication check in Database
      const startOfDay = new Date(recordDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(recordDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const existingRecord = await prisma.rainfallRecord.findFirst({
        where: {
          districtId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (existingRecord) {
        // Update existing record to avoid duplicate entries in DB
        await prisma.rainfallRecord.update({
          where: { id: existingRecord.id },
          data: {
            rainfallMm: mm,
            soilSaturation: item.soilSaturation ? Number(item.soilSaturation) : existingRecord.soilSaturation,
            notes: item.notes ? String(item.notes) : existingRecord.notes,
            createdById: session.userId,
          },
        });
        updatedCount++;
      } else {
        // Insert new unique record
        await prisma.rainfallRecord.create({
          data: {
            districtId,
            date: recordDate,
            rainfallMm: mm,
            soilSaturation: item.soilSaturation ? Number(item.soilSaturation) : null,
            notes: item.notes ? String(item.notes) : "Bulk uploaded dataset",
            source: DataSource.UPLOAD,
            createdById: session.userId,
          },
        });
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Dataset processed: ${insertedCount} new records inserted, ${updatedCount} existing records updated, ${duplicateCount} duplicate rows handled.`,
      insertedCount,
      updatedCount,
      duplicateCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Bulk Upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
