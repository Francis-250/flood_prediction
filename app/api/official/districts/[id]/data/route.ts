import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { predictFloodRisk } from "@/lib/ai";
import { DataSource, Role } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session || (session.role !== Role.OFFICIAL && session.role !== Role.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { date, rainfallMm, soilSaturation, notes } = body;

    if (rainfallMm === undefined || rainfallMm === null) {
      return NextResponse.json(
        { success: false, error: "Rainfall amount (mm) is required" },
        { status: 400 }
      );
    }

    const district = await prisma.district.findUnique({
      where: { id },
    });

    if (!district) {
      return NextResponse.json({ success: false, error: "District not found" }, { status: 404 });
    }

    const recordDate = date ? new Date(date) : new Date();
    const mm = Number(rainfallMm);
    const saturation = soilSaturation != null ? Number(soilSaturation) : null;

    const newRecord = await prisma.rainfallRecord.create({
      data: {
        districtId: district.id,
        date: recordDate,
        rainfallMm: mm,
        soilSaturation: saturation,
        notes: notes ? String(notes).trim() : null,
        source: DataSource.MANUAL,
        createdById: session.userId,
      },
    });

    // Automatically trigger AI flood risk assessment after new rainfall record
    const aiPrediction = await predictFloodRisk({
      districtName: district.name,
      rainfallMm: mm,
      daysOfRain: 3,
      slope: district.slope || 15,
      soilSaturation: saturation || 60,
      elevation: district.elevation || 1600,
    });

    await prisma.prediction.create({
      data: {
        districtId: district.id,
        riskLevel: aiPrediction.riskLevel,
        confidence: aiPrediction.confidence,
        reasoning: aiPrediction.reasoning,
        inputData: {
          rainfallMm: mm,
          daysOfRain: 3,
          slope: district.slope || 15,
          soilSaturation: saturation || 60,
          elevation: district.elevation || 1600,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newRecord,
      prediction: aiPrediction,
    });
  } catch (error: any) {
    console.error("Rainfall Record Create error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
