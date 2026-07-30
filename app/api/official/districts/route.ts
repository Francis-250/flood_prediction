import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getDistrictInfo } from "@/lib/location";
import { Role, RiskLevel } from "@prisma/client";

export async function GET() {
  try {
    const districts = await prisma.district.findMany({
      include: {
        cells: { select: { id: true, name: true } },
        predictions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        rainfallRecords: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = districts.map((d) => {
      const latestPred = d.predictions[0];
      const latestRain = d.rainfallRecords[0];

      // Calculate risk level from latest prediction or latest rainfall
      let currentRisk: RiskLevel = latestPred ? latestPred.riskLevel : RiskLevel.LOW;
      if (!latestPred && latestRain) {
        if (latestRain.rainfallMm > 80) currentRisk = RiskLevel.HIGH;
        else if (latestRain.rainfallMm > 40) currentRisk = RiskLevel.MEDIUM;
      }

      return {
        id: d.id,
        name: d.name,
        province: d.province,
        elevation: d.elevation,
        slope: d.slope,
        latitude: d.latitude,
        longitude: d.longitude,
        cellCount: d.cells.length,
        currentRisk,
        latestRainfallMm: latestRain ? latestRain.rainfallMm : 0,
        latestRainfallDate: latestRain ? latestRain.date : null,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Districts GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.OFFICIAL && session.role !== Role.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, province, elevation, slope, latitude, longitude, cells } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "District name is required" },
        { status: 400 }
      );
    }

    // Verify district info from data.json source of truth
    const geoInfo = getDistrictInfo(name);
    const assignedProvince = province || (geoInfo ? geoInfo.province : "Northern Province");

    const existing = await prisma.district.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `District "${name}" is already created in the database` },
        { status: 400 }
      );
    }

    const newDistrict = await prisma.district.create({
      data: {
        name,
        province: assignedProvince,
        elevation: elevation ? Number(elevation) : 1600,
        slope: slope ? Number(slope) : 15,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    });

    // Create cells if provided or extracted from data.json
    const cellsToCreate: string[] = Array.isArray(cells) && cells.length > 0
      ? cells
      : (geoInfo ? geoInfo.cells.slice(0, 10) : []);

    for (const cellName of cellsToCreate) {
      await prisma.cell.create({
        data: {
          districtId: newDistrict.id,
          name: cellName,
        },
      }).catch(() => {}); // ignore duplicate cells
    }

    return NextResponse.json({ success: true, data: newDistrict });
  } catch (error: any) {
    console.error("District Create error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
