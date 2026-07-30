import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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

    const homeDistrictId = user?.districtId;

    // Fetch alerts for home district AND all HIGH/MEDIUM risk broadcasts nationwide
    // (so residents moving or traveling for the day are notified of all active warnings)
    const alerts = await prisma.alert.findMany({
      where: {
        OR: [
          homeDistrictId ? { districtId: homeDistrictId } : {},
          { riskLevel: RiskLevel.HIGH },
          { riskLevel: RiskLevel.MEDIUM },
        ],
      },
      include: {
        district: { select: { id: true, name: true, province: true } },
      },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      homeDistrictId: homeDistrictId || null,
      data: alerts,
    });
  } catch (error: any) {
    console.error("Resident Alerts GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
