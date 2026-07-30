import "server-only";
import { getSession } from "./auth";
import prisma from "./prisma";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        districtId: true,
        district: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      districtId: user.districtId,
      districtName: user.district?.name || null,
    };
  } catch (error) {
    console.error("Failed to fetch current user", error);
    return {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      districtId: session.districtId || null,
      districtName: null,
    };
  }
}
