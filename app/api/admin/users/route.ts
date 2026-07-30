import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleFilter && Object.values(Role).includes(roleFilter as Role)) {
      where.role = roleFilter as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        districtId: true,
        district: {
          select: { id: true, name: true, province: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Admin Users GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, districtName, isActive } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    let districtId = null;
    if (districtName) {
      const d = await prisma.district.findUnique({
        where: { name: districtName },
      });
      if (d) districtId = d.id;
    }

    const hashedPassword = await hashPassword(String(password));

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: (role as Role) || Role.RESIDENT,
        districtId,
        isActive: isActive !== false,
        isVerified: true, // Created by admin is auto-verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        districtId: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Admin User Create error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
