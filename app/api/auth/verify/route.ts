import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!otp) {
      return NextResponse.json(
        { success: false, error: "6-digit OTP code is required" },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: cleanOtp,
        ...(cleanEmail ? { email: cleanEmail } : {}),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid 6-digit OTP verification code" },
        { status: 400 }
      );
    }

    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: "Verification OTP code has expired" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email address verified successfully! You can now log in.",
    });
  } catch (error: any) {
    console.error("Verification API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP code" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ success: false, error: "OTP is required" }, { status: 400 });
  }
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) {
    return NextResponse.json({ success: false, error: "Invalid OTP code" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null, verificationExpiry: null },
  });
  return NextResponse.json({ success: true, message: "Account verified successfully!" });
}
