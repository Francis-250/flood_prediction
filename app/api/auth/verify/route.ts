import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: "Verification token has expired. Please request a new link." },
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
      { success: false, error: error.message || "Failed to verify email" },
      { status: 500 }
    );
  }
}
