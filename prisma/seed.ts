import "dotenv/config";
import { PrismaClient, Role, RiskLevel, DataSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/password";
import rawData from "../lib/data.json";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("Seeding database...");

  // 1. Create Districts
  const districtConfigs = [
    { name: "Nyabihu", province: "North", elevation: 2200, slope: 22.5, lat: -1.65, lng: 29.50 },
    { name: "Musanze", province: "North", elevation: 1850, slope: 18.0, lat: -1.50, lng: 29.63 },
    { name: "Rubavu", province: "West", elevation: 1500, slope: 12.0, lat: -1.68, lng: 29.26 },
    { name: "Gicumbi", province: "North", elevation: 2100, slope: 20.0, lat: -1.60, lng: 30.07 },
    { name: "Gasabo", province: "Kigali City", elevation: 1450, slope: 10.0, lat: -1.95, lng: 30.11 },
    { name: "Karongi", province: "West", elevation: 1600, slope: 15.0, lat: -2.06, lng: 29.35 },
    { name: "Bugesera", province: "East", elevation: 1300, slope: 5.0, lat: -2.25, lng: 30.08 },
    { name: "Burera", province: "North", elevation: 1900, slope: 19.0, lat: -1.45, lng: 29.80 },
    { name: "Ngororero", province: "West", elevation: 1750, slope: 21.0, lat: -1.86, lng: 29.56 },
    { name: "Kicukiro", province: "Kigali City", elevation: 1400, slope: 7.0, lat: -1.98, lng: 30.12 },
  ];

  const districtMap = new Map<string, string>();

  for (const item of districtConfigs) {
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

    // Extract cells from data.json for this district
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

      // Add top 5 cells for demo
      const topCells = Array.from(cellSet).slice(0, 5);
      for (const cellName of topCells) {
        await prisma.cell.upsert({
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
        });
      }
    }
  }

  // 2. Create Users
  const defaultPasswordHash = await hashPassword("password123");

  const nyabihuId = districtMap.get("Nyabihu");

  // Admin user
  const adminUser = await prisma.user.upsert({
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
  });

  // Official user
  const officialUser = await prisma.user.upsert({
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
  });

  // Resident user
  await prisma.user.upsert({
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
  });

  // 3. Create Rainfall Records (Last 14 days for Nyabihu, Musanze, Rubavu)
  const targetDistricts = ["Nyabihu", "Musanze", "Rubavu", "Gicumbi", "Gasabo"];
  const now = new Date();

  for (const dName of targetDistricts) {
    const dId = districtMap.get(dName);
    if (!dId) continue;

    // Delete old seed rainfall records for clean state
    await prisma.rainfallRecord.deleteMany({ where: { districtId: dId } });

    for (let i = 13; i >= 0; i--) {
      const recordDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      let baseMm = 15;
      if (dName === "Nyabihu") baseMm = 65 + Math.sin(i) * 35 + (i < 3 ? 40 : 0);
      else if (dName === "Musanze") baseMm = 45 + Math.cos(i) * 25;
      else baseMm = 20 + Math.random() * 20;

      const rainfallMm = Math.max(0, Math.round(baseMm * 10) / 10);
      const soilSaturation = Math.min(98, Math.max(20, Math.round((rainfallMm * 0.8 + 30) * 10) / 10));

      await prisma.rainfallRecord.create({
        data: {
          districtId: dId,
          date: recordDate,
          rainfallMm,
          soilSaturation,
          notes: i === 0 ? "Heavy localized precipitation recorded at weather station." : "Standard automatic telemetry sync.",
          source: DataSource.MANUAL,
          createdById: officialUser.id,
        },
      });
    }
  }

  // 4. Create Initial Alerts
  if (nyabihuId) {
    await prisma.alert.deleteMany({ where: { districtId: nyabihuId } });
    await prisma.alert.createMany({
      data: [
        {
          districtId: nyabihuId,
          riskLevel: RiskLevel.HIGH,
          message: "CRITICAL FLOOD WARNING: Heavy rain in Nyabihu high elevation slopes. Move to higher grounds immediately.",
          simulated: false,
          triggeredById: officialUser.id,
          sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          districtId: nyabihuId,
          riskLevel: RiskLevel.MEDIUM,
          message: "Moderate flood risk warning: Sustained precipitation may cause river overflows in low basin zones.",
          simulated: true,
          triggeredById: officialUser.id,
          sentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      ],
    });
  }

  const musanzeId = districtMap.get("Musanze");
  if (musanzeId) {
    await prisma.alert.deleteMany({ where: { districtId: musanzeId } });
    await prisma.alert.create({
      data: {
        districtId: musanzeId,
        riskLevel: RiskLevel.MEDIUM,
        message: "ADVISORY: Increased surface runoff expected near volcanic foothills. Drive with caution.",
        simulated: true,
        triggeredById: officialUser.id,
        sentAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
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
        reasoning: "High risk: 105mm rainfall combined with 88% soil saturation on 22.5° steep slopes creates severe runaway runoff conditions.",
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

  if (musanzeId) {
    await prisma.prediction.deleteMany({ where: { districtId: musanzeId } });
    await prisma.prediction.create({
      data: {
        districtId: musanzeId,
        riskLevel: RiskLevel.MEDIUM,
        confidence: 88.0,
        reasoning: "Moderate risk: 55mm rainfall over volcanic foothills with 70% soil capacity requires continuous monitoring.",
        inputData: {
          rainfallMm: 55,
          daysOfRain: 3,
          slope: 18.0,
          soilSaturation: 70,
          elevation: 1850,
        },
      },
    });
  }

  const rubavuId = districtMap.get("Rubavu");
  if (rubavuId) {
    await prisma.prediction.deleteMany({ where: { districtId: rubavuId } });
    await prisma.prediction.create({
      data: {
        districtId: rubavuId,
        riskLevel: RiskLevel.LOW,
        confidence: 91.2,
        reasoning: "Low risk: Mild 18mm precipitation with moderate soil capacity presents minimal threat of inundation.",
        inputData: {
          rainfallMm: 18,
          daysOfRain: 2,
          slope: 12.0,
          soilSaturation: 45,
          elevation: 1500,
        },
      },
    });
  }

  const gicumbiId = districtMap.get("Gicumbi");
  if (gicumbiId) {
    await prisma.prediction.deleteMany({ where: { districtId: gicumbiId } });
    await prisma.prediction.create({
      data: {
        districtId: gicumbiId,
        riskLevel: RiskLevel.HIGH,
        confidence: 89.4,
        reasoning: "High risk: Sustained 92mm rainfall on steep 20° high mountain slopes presents high landslide and runoff risk.",
        inputData: {
          rainfallMm: 92,
          daysOfRain: 4,
          slope: 20.0,
          soilSaturation: 82,
          elevation: 2100,
        },
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
