import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient, Role, RiskLevel, DataSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../lib/password";
import rawData from "../lib/data.json";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

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

const pool = new Pool({
  connectionString,
  ssl: getSslConfig(connectionString),
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    "Seeding Neon database at:",
    connectionString?.split("@")[1] || "Neon Host",
  );

  // 1. Create Districts
  const districtConfigs = [
    {
      name: "Nyabihu",
      province: "North",
      elevation: 2200,
      slope: 22.5,
      lat: -1.65,
      lng: 29.5,
    },
    {
      name: "Musanze",
      province: "North",
      elevation: 1850,
      slope: 18.0,
      lat: -1.5,
      lng: 29.63,
    },
    {
      name: "Rubavu",
      province: "West",
      elevation: 1500,
      slope: 12.0,
      lat: -1.68,
      lng: 29.26,
    },
    {
      name: "Gicumbi",
      province: "North",
      elevation: 2100,
      slope: 20.0,
      lat: -1.6,
      lng: 30.07,
    },
    {
      name: "Gasabo",
      province: "Kigali City",
      elevation: 1450,
      slope: 10.0,
      lat: -1.95,
      lng: 30.11,
    },
    {
      name: "Karongi",
      province: "West",
      elevation: 1600,
      slope: 15.0,
      lat: -2.06,
      lng: 29.35,
    },
    {
      name: "Bugesera",
      province: "East",
      elevation: 1300,
      slope: 5.0,
      lat: -2.25,
      lng: 30.08,
    },
    {
      name: "Burera",
      province: "North",
      elevation: 1900,
      slope: 19.0,
      lat: -1.45,
      lng: 29.8,
    },
    {
      name: "Ngororero",
      province: "West",
      elevation: 1750,
      slope: 21.0,
      lat: -1.86,
      lng: 29.56,
    },
    {
      name: "Kicukiro",
      province: "Kigali City",
      elevation: 1400,
      slope: 7.0,
      lat: -1.98,
      lng: 30.12,
    },
  ];

  const districtMap = new Map<string, string>();

  await Promise.all(
    districtConfigs.map(async (item) => {
      const district = await prisma.district.upsert({
        where: { name: item.name },
        update: {
          province: item.province,
          elevation: item.elevation,
          slope: item.slope,
          latitude: item.lat,
          longitude: item.lng,
        },
        create: {
          name: item.name,
          province: item.province,
          elevation: item.elevation,
          slope: item.slope,
          latitude: item.lat,
          longitude: item.lng,
        },
      });

      districtMap.set(item.name, district.id);

      const dataAny = rawData as any;
      if (dataAny[item.province] && dataAny[item.province][item.name]) {
        const sectorsObj = dataAny[item.province][item.name];
        const cellSet = new Set<string>();
        for (const sectorName of Object.keys(sectorsObj)) {
          const cells = sectorsObj[sectorName];
          if (cells) {
            for (const cellName of Object.keys(cells)) {
              cellSet.add(cellName);
            }
          }
        }

        const topCells = Array.from(cellSet).slice(0, 3);
        await Promise.all(
          topCells.map((cellName) =>
            prisma.cell.upsert({
              where: {
                districtId_name: {
                  districtId: district.id,
                  name: cellName,
                },
              },
              update: {},
              create: {
                districtId: district.id,
                name: cellName,
              },
            }),
          ),
        );
      }
    }),
  );

  // 2. Create Users
  const defaultPasswordHash = await hashPassword("password123");
  const nyabihuId = districtMap.get("Nyabihu");

  const [adminUser, officialUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@floodguard.rw" },
      update: { isActive: true, isVerified: true },
      create: {
        name: "System Administrator",
        email: "admin@floodguard.rw",
        password: defaultPasswordHash,
        role: Role.ADMIN,
        isActive: true,
        isVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "official@floodguard.rw" },
      update: { isActive: true, isVerified: true, districtId: nyabihuId },
      create: {
        name: "Official - Nyabihu",
        email: "official@floodguard.rw",
        password: defaultPasswordHash,
        role: Role.OFFICIAL,
        districtId: nyabihuId,
        isActive: true,
        isVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "resident@floodguard.rw" },
      update: { isActive: true, isVerified: true, districtId: nyabihuId },
      create: {
        name: "Resident - Nyabihu",
        email: "resident@floodguard.rw",
        password: defaultPasswordHash,
        role: Role.RESIDENT,
        districtId: nyabihuId,
        isActive: true,
        isVerified: true,
      },
    }),
  ]);

  // 3. Create Rainfall Records
  const targetDistricts = ["Nyabihu", "Musanze", "Rubavu", "Gicumbi", "Gasabo"];
  const now = new Date();

  await Promise.all(
    targetDistricts.map(async (dName) => {
      const dId = districtMap.get(dName);
      if (!dId) return;

      await prisma.rainfallRecord.deleteMany({ where: { districtId: dId } });

      const recordsToCreate = [];
      for (let i = 13; i >= 0; i--) {
        const recordDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        let baseMm = 15;
        if (dName === "Nyabihu")
          baseMm = 65 + Math.sin(i) * 35 + (i < 3 ? 40 : 0);
        else if (dName === "Musanze") baseMm = 45 + Math.cos(i) * 25;
        else baseMm = 20 + Math.random() * 20;

        const rainfallMm = Math.max(0, Math.round(baseMm * 10) / 10);
        const soilSaturation = Math.min(
          98,
          Math.max(20, Math.round((rainfallMm * 0.8 + 30) * 10) / 10),
        );

        recordsToCreate.push({
          districtId: dId,
          date: recordDate,
          rainfallMm,
          soilSaturation,
          notes:
            i === 0
              ? "Heavy localized precipitation recorded at weather station."
              : "Standard automatic telemetry sync.",
          source: DataSource.MANUAL,
          createdById: officialUser.id,
        });
      }

      await prisma.rainfallRecord.createMany({ data: recordsToCreate });
    }),
  );

  // 4. Initial Alerts
  if (nyabihuId) {
    await prisma.alert.deleteMany({ where: { districtId: nyabihuId } });
    await prisma.alert.createMany({
      data: [
        {
          districtId: nyabihuId,
          riskLevel: RiskLevel.HIGH,
          message:
            "CRITICAL FLOOD WARNING: Heavy rain in Nyabihu high elevation slopes. Move to higher grounds immediately.",
          simulated: false,
          triggeredById: officialUser.id,
          sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
        {
          districtId: nyabihuId,
          riskLevel: RiskLevel.MEDIUM,
          message:
            "Moderate flood risk warning: Sustained precipitation may cause river overflows in low basin zones.",
          simulated: true,
          triggeredById: officialUser.id,
          sentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      ],
    });
  }

  // 5. Initial Predictions
  if (nyabihuId) {
    await prisma.prediction.deleteMany({ where: { districtId: nyabihuId } });
    await prisma.prediction.create({
      data: {
        districtId: nyabihuId,
        riskLevel: RiskLevel.HIGH,
        confidence: 93.5,
        reasoning:
          "High risk: 105mm rainfall combined with 88% soil saturation on 22.5° steep slopes creates severe runaway runoff conditions.",
        inputData: {
          rainfallMm: 105,
          daysOfRain: 4,
          slope: 22.5,
          soilSaturation: 88,
          elevation: 2200,
        },
      },
    });
  }

  console.log("Neon Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
