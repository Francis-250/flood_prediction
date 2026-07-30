import React from "react";
import Link from "next/link";
import { MapPin, UploadCloud, BrainCircuit, ChevronRight, Droplets } from "lucide-react";
import prisma from "@/lib/prisma";
import { RiskLevel } from "@prisma/client";
import OfficialDashboardChart from "@/components/OfficialDashboardChart";

export default async function OfficialDashboardPage() {
  const districts = await prisma.district.findMany({
    include: {
      rainfallRecords: {
        orderBy: { date: "desc" },
        take: 1,
      },
      predictions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const chartData = districts.map((d) => {
    const latestRain = d.rainfallRecords[0];
    return {
      districtName: d.name,
      rainfallMm: latestRain ? latestRain.rainfallMm : 0,
      soilSaturation: latestRain?.soilSaturation ?? 50,
    };
  });

  const riskBadgeStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
  };

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Official Flood Operations Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time district telemetry, flood risk forecasting line charts, and disaster operations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/official/districts/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-teal-600" />
            <span>Upload Dataset</span>
          </Link>
          <Link
            href="/official/predict"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Run AI Prediction</span>
          </Link>
        </div>
      </div>

      {/* Main Real-Time Telemetry Line Chart replacing summary cards */}
      <OfficialDashboardChart data={chartData} />

      {/* District Risk Directory Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Monitored District Directory ({districts.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {districts.map((d) => {
            const latestPred = d.predictions[0];
            const latestRain = d.rainfallRecords[0];
            let risk: RiskLevel = latestPred ? latestPred.riskLevel : RiskLevel.LOW;
            if (!latestPred && latestRain) {
              if (latestRain.rainfallMm > 80) risk = RiskLevel.HIGH;
              else if (latestRain.rainfallMm > 40) risk = RiskLevel.MEDIUM;
            }

            return (
              <Link
                key={d.id}
                href={`/official/districts/${d.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-teal-300 transition-all block group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-600 transition-colors">
                      {d.name}
                    </h3>
                    <p className="text-xs text-slate-500">{d.province} Province</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${riskBadgeStyles[risk]}`}
                  >
                    {risk} RISK
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Recent Rainfall</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      {latestRain ? `${latestRain.rainfallMm} mm` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Elevation / Slope</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {d.elevation ? `${d.elevation}m` : "N/A"} | {d.slope ? `${d.slope}°` : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:translate-x-1 transition-transform">
                    <span>View Detail & Trends</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
