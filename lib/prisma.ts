import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaConfigKey?: string;
};

function getSslConfig(connectionString: string) {
  if (
    process.env.DATABASE_SSL === "false" ||
    process.env.DATABASE_SSL === "0"
  ) {
    return false;
  }
  if (process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1") {
    return { rejectUnauthorized: false };
  }

  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");

    if (sslmode === "disable") {
      return false;
    }

    if (
      sslmode === "require" ||
      sslmode === "prefer" ||
      sslmode === "verify-ca" ||
      sslmode === "verify-full"
    ) {
      return { rejectUnauthorized: false };
    }

    const isLocal =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "0.0.0.0" ||
      url.hostname.endsWith(".local");

    if (isLocal) {
      return false;
    }

    return { rejectUnauthorized: false };
  } catch {
    return false;
  }
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const ssl = getSslConfig(connectionString);
  const pool = new Pool({
    connectionString,
    ssl,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const currentConfigKey = `${process.env.DATABASE_URL}_${JSON.stringify(
  process.env.DATABASE_URL ? getSslConfig(process.env.DATABASE_URL) : null,
)}`;

// Invalidate stale client if database configuration changed during dev server session
if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaConfigKey !== currentConfigKey
) {
  delete globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConfigKey = currentConfigKey;
}

export default prisma;
