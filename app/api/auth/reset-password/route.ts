import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, token, password } = body;
    const resetOtp = otp || token;

    if (!resetOtp || !password) {
      return NextResponse.json(
        { success: false, error: "6-digit OTP code and new password are required" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanOtp = String(resetOtp).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: cleanOtp,
        ...(cleanEmail ? { email: cleanEmail } : {}),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid 6-digit OTP reset code" },
        { status: 400 }
      );
    }

    if (user.resetExpiry && user.resetExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: "Password reset OTP code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(String(password));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
