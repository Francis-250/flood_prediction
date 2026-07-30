import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { predictFloodRisk } from "@/lib/ai";
import { RiskLevel } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const district = await prisma.district.findUnique({
      where: { id },
      include: {
        cells: true,
        rainfallRecords: {
          orderBy: { date: "desc" },
          take: 30,
        },
        predictions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        alerts: {
          orderBy: { sentAt: "desc" },
          take: 10,
        },
      },
    });

    if (!district) {
      return NextResponse.json({ success: false, error: "District not found" }, { status: 404 });
    }

    const latestRainfall = district.rainfallRecords[0];
    let latestPrediction = district.predictions[0];

    // Compute live AI prediction if latest rainfall exists and no prediction exists for today
    if (latestRainfall) {
      const rainfallMm = latestRainfall.rainfallMm;
      const daysOfRain = 3;
      const slope = district.slope || 15;
      const soilSaturation = latestRainfall.soilSaturation || 60;
      const elevation = district.elevation || 1600;

      const aiResult = await predictFloodRisk({
        districtName: district.name,
        rainfallMm,
        daysOfRain,
        slope,
        soilSaturation,
        elevation,
      });

      latestPrediction = {
        id: "live",
        districtId: district.id,
        riskLevel: aiResult.riskLevel,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        inputData: {
          rainfallMm,
          daysOfRain,
          slope,
          soilSaturation,
          elevation,
        },
        createdAt: new Date(),
      };
    }

    // Format rainfall trend for Recharts
    const rainfallTrend = district.rainfallRecords
      .slice(0, 14)
      .reverse()
      .map((r) => ({
        date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rainfallMm: r.rainfallMm,
        soilSaturation: r.soilSaturation || 0,
      }));

    return NextResponse.json({
      success: true,
      data: {
        ...district,
        currentRisk: latestPrediction ? latestPrediction.riskLevel : RiskLevel.LOW,
        latestPrediction,
        rainfallTrend,
      },
    });
  } catch (error: any) {
    console.error("District Detail GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
