import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    let districtId = user?.districtId;

    if (!districtId) {
      const firstD = await prisma.district.findFirst();
      districtId = firstD?.id;
    }

    if (!districtId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const alerts = await prisma.alert.findMany({
      where: { districtId },
      include: {
        district: { select: { id: true, name: true, province: true } },
      },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    console.error("Resident Alerts GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
