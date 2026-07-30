import { NextRequest, NextResponse } from "next/server";
import randomBytes from "node:crypto";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      const token = randomBytes.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetExpiry: expiry,
        },
      });

      const origin = req.headers.get("origin") || req.nextUrl.origin;
      await sendPasswordResetEmail(cleanEmail, token, origin);
    }

    // Always return success for security (prevents user enumeration)
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, password reset instructions have been sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
