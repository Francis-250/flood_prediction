import { NextRequest, NextResponse } from "next/server";
import randomBytes from "node:crypto";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, districtId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(String(password));
    const token = randomBytes.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Every self-registered user defaults strictly to RESIDENT. Admins assign OFFICIAL or ADMIN roles.
    const selectedRole: Role = Role.RESIDENT;

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: selectedRole,
        districtId: districtId ? String(districtId) : null,
        isVerified: false,
        verificationToken: token,
        verificationExpiry: expiry,
      },
    });

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    await sendVerificationEmail(cleanEmail, token, origin);

    return NextResponse.json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account before logging in.",
      userId: newUser.id,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}
