import { NextRequest, NextResponse } from "next/server";
import { predictFloodRisk } from "@/lib/ai";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      districtId,
      districtName,
      rainfallMm,
      daysOfRain,
      slope,
      soilSaturation,
      elevation,
    } = body;

    const rainfallNum = Number(rainfallMm) || 0;
    const daysNum = Number(daysOfRain) || 1;
    const slopeNum = Number(slope) || 5;
    const saturationNum = Number(soilSaturation) || 50;
    const elevationNum = elevation != null ? Number(elevation) : null;

    let targetDistrictName = districtName;
    let targetDistrictId = districtId;

    if (districtId && !targetDistrictName) {
      const d = await prisma.district.findUnique({
        where: { id: districtId },
        select: { name: true, slope: true, elevation: true },
      });
      if (d) {
        targetDistrictName = d.name;
      }
    }

    const predictionResult = await predictFloodRisk({
      districtName: targetDistrictName,
      rainfallMm: rainfallNum,
      daysOfRain: daysNum,
      slope: slopeNum,
      soilSaturation: saturationNum,
      elevation: elevationNum,
    });

    // Save prediction record if districtId is present
    if (targetDistrictId) {
      try {
        await prisma.prediction.create({
          data: {
            districtId: targetDistrictId,
            riskLevel: predictionResult.riskLevel,
            confidence: predictionResult.confidence,
            reasoning: predictionResult.reasoning,
            inputData: {
              rainfallMm: rainfallNum,
              daysOfRain: daysNum,
              slope: slopeNum,
              soilSaturation: saturationNum,
              elevation: elevationNum,
            },
          },
        });
      } catch (dbErr) {
        console.error("Failed to save prediction record:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: predictionResult,
    });
  } catch (error: any) {
    console.error("Prediction API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process flood prediction" },
      { status: 500 }
    );
  }
}
