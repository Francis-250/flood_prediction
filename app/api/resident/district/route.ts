import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { predictFloodRisk } from "@/lib/ai";
import { RiskLevel } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { districtId: true },
    });

    if (!user || !user.districtId) {
      // Fallback to first district if resident has no district assigned
      const defaultDistrict = await prisma.district.findFirst({
        include: {
          predictions: { orderBy: { createdAt: "desc" }, take: 1 },
          rainfallRecords: { orderBy: { date: "desc" }, take: 1 },
          alerts: { orderBy: { sentAt: "desc" }, take: 5 },
        },
      });

      if (!defaultDistrict) {
        return NextResponse.json({ success: false, error: "No district configured" }, { status: 404 });
      }

      const latestPred = defaultDistrict.predictions[0];
      const latestRain = defaultDistrict.rainfallRecords[0];

      return NextResponse.json({
        success: true,
        data: {
          id: defaultDistrict.id,
          name: defaultDistrict.name,
          province: defaultDistrict.province,
          elevation: defaultDistrict.elevation,
          slope: defaultDistrict.slope,
          currentRisk: latestPred ? latestPred.riskLevel : RiskLevel.LOW,
          confidence: latestPred ? latestPred.confidence : 85,
          reasoning: latestPred ? latestPred.reasoning : "Precipitation within normal seasonal thresholds.",
          latestRainfallMm: latestRain ? latestRain.rainfallMm : 0,
          latestRainfallDate: latestRain ? latestRain.date : null,
          recentAlerts: defaultDistrict.alerts,
        },
      });
    }

    const district = await prisma.district.findUnique({
      where: { id: user.districtId },
      include: {
        predictions: { orderBy: { createdAt: "desc" }, take: 1 },
        rainfallRecords: { orderBy: { date: "desc" }, take: 1 },
      },
    });

    if (!district) {
      return NextResponse.json({ success: false, error: "Assigned district not found" }, { status: 404 });
    }

    const recentAlerts = await prisma.alert.findMany({
      where: {
        OR: [
          { districtId: district.id },
          { riskLevel: RiskLevel.HIGH },
        ],
      },
      include: {
        district: { select: { id: true, name: true, province: true } },
      },
      orderBy: { sentAt: "desc" },
      take: 5,
    });

    let latestPred = district.predictions[0];
    const latestRain = district.rainfallRecords[0];

    if (!latestPred && latestRain) {
      const aiRes = await predictFloodRisk({
        districtName: district.name,
        rainfallMm: latestRain.rainfallMm,
        daysOfRain: 3,
        slope: district.slope || 15,
        soilSaturation: latestRain.soilSaturation || 60,
        elevation: district.elevation || 1600,
      });

      latestPred = {
        id: "live",
        districtId: district.id,
        riskLevel: aiRes.riskLevel,
        confidence: aiRes.confidence,
        reasoning: aiRes.reasoning,
        inputData: {},
        createdAt: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        id: district.id,
        name: district.name,
        province: district.province,
        elevation: district.elevation,
        slope: district.slope,
        currentRisk: latestPred ? latestPred.riskLevel : RiskLevel.LOW,
        confidence: latestPred ? latestPred.confidence : 85,
        reasoning: latestPred ? latestPred.reasoning : "Precipitation within normal seasonal thresholds.",
        latestRainfallMm: latestRain ? latestRain.rainfallMm : 0,
        latestRainfallDate: latestRain ? latestRain.date : null,
        recentAlerts: recentAlerts,
      },
    });
  } catch (error: any) {
    console.error("Resident District GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
