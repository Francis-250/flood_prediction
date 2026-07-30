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
    const errors: string[] = [];

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

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} rainfall records.`,
      insertedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Bulk Upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
