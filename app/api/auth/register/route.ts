import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendVerificationOtpEmail } from "@/lib/email";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, districtId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email address already exists",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(String(password));

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Every self-registered user defaults strictly to RESIDENT.
    const selectedRole: Role = Role.RESIDENT;

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: selectedRole,
        districtId: districtId ? String(districtId) : null,
        isVerified: false,
        verificationToken: otpCode,
        verificationExpiry: expiry,
      },
    });

    await sendVerificationOtpEmail(cleanEmail, otpCode);

    return NextResponse.json({
      success: true,
      message:
        "Registration successful! Check your email for your 6-digit verification OTP code.",
      userId: newUser.id,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register user" },
      { status: 500 },
    );
  }
}
