import { NextRequest, NextResponse } from "next/server";
import { predictFloodRisk } from "@/lib/ai";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { districtId } = body;

    if (!districtId) {
      return NextResponse.json(
        { success: false, error: "District ID is required for AI prediction" },
        { status: 400 }
      );
    }

    // Fetch actual district profile and latest recorded rainfall telemetry from database
    const district = await prisma.district.findUnique({
      where: { id: districtId },
      include: {
        rainfallRecords: { orderBy: { date: "desc" }, take: 14 },
      },
    });

    if (!district) {
      return NextResponse.json(
        { success: false, error: "Selected district not found in database" },
        { status: 404 }
      );
    }

    const latestRain = district.rainfallRecords[0];
    const rainfallMm = latestRain ? latestRain.rainfallMm : 0;
    const soilSaturation = latestRain?.soilSaturation ?? 50;

    // Calculate days of rain based on recent consecutive rainy days in database
    let daysOfRain = 0;
    for (const r of district.rainfallRecords) {
      if (r.rainfallMm > 5) daysOfRain++;
      else break;
    }
    if (daysOfRain === 0 && rainfallMm > 0) daysOfRain = 1;

    const slope = district.slope || 15;
    const elevation = district.elevation || 1600;

    const predictionResult = await predictFloodRisk({
      districtName: district.name,
      rainfallMm,
      daysOfRain,
      slope,
      soilSaturation,
      elevation,
    });

    // Save prediction record to database
    await prisma.prediction.create({
      data: {
        districtId: district.id,
        riskLevel: predictionResult.riskLevel,
        confidence: predictionResult.confidence,
        reasoning: predictionResult.reasoning,
        inputData: {
          rainfallMm,
          daysOfRain,
          slope,
          soilSaturation,
          elevation,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...predictionResult,
        districtName: district.name,
        province: district.province,
        rainfallMm,
        daysOfRain,
        slope,
        soilSaturation,
        elevation,
      },
    });
  } catch (error: any) {
    console.error("Prediction API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process flood prediction" },
      { status: 500 }
    );
  }
}
