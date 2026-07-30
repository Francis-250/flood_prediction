import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { RiskLevel, Role } from "@prisma/client";

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      include: {
        district: { select: { id: true, name: true, province: true } },
        triggeredBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    console.error("Alerts GET error:", error);
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
    const { districtId, districtName, riskLevel, message, simulated } = body;

    let targetDistrictId = districtId;

    if (!targetDistrictId && districtName) {
      const d = await prisma.district.findUnique({ where: { name: districtName } });
      if (d) targetDistrictId = d.id;
    }

    if (!targetDistrictId) {
      return NextResponse.json(
        { success: false, error: "Target district is required" },
        { status: 400 }
      );
    }

    const selectedRisk: RiskLevel =
      riskLevel && Object.values(RiskLevel).includes(riskLevel as RiskLevel)
        ? (riskLevel as RiskLevel)
        : RiskLevel.MEDIUM;

    const alertMessage =
      message ||
      `FLOOD WARNING ALERT (${selectedRisk}): High precipitation level detected. Residents in vulnerable sectors must exercise caution.`;

    const newAlert = await prisma.alert.create({
      data: {
        districtId: targetDistrictId,
        riskLevel: selectedRisk,
        message: String(alertMessage).trim(),
        simulated: simulated !== false, // default true unless explicitly real
        triggeredById: session.userId,
      },
      include: {
        district: { select: { id: true, name: true, province: true } },
        triggeredBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: newAlert });
  } catch (error: any) {
    console.error("Alert Trigger error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
