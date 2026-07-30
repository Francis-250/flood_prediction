"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Bell, MapPin, Droplets, ArrowRight, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { RiskLevel } from "@prisma/client";

interface ResidentDistrictData {
  id: string;
  name: string;
  province: string;
  elevation: number | null;
  slope: number | null;
  currentRisk: RiskLevel;
  confidence: number;
  reasoning: string;
  latestRainfallMm: number;
  latestRainfallDate: string | null;
  recentAlerts: {
    id: string;
    riskLevel: RiskLevel;
    message: string;
    sentAt: string;
  }[];
}

export default function ResidentDashboardPage() {
  const [data, setData] = useState<ResidentDistrictData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resident/district")
      .then((res) => res.json())
      .then((resData) => {
        setLoading(false);
        if (resData.success && resData.data) {
          setData(resData.data);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your district safety portal...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No district assigned to your account.</div>;
  }

  const riskCardStyles: Record<RiskLevel, { cardBg: string; border: string; badgeBg: string; text: string; icon: React.ReactNode }> = {
    LOW: {
      cardBg: "bg-emerald-50/90",
      border: "border-emerald-200",
      badgeBg: "bg-emerald-600 text-white",
      text: "text-emerald-950",
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-600" />,
    },
    MEDIUM: {
      cardBg: "bg-amber-50/90",
      border: "border-amber-200",
      badgeBg: "bg-amber-500 text-white",
      text: "text-amber-950",
      icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
    },
    HIGH: {
      cardBg: "bg-rose-50/90",
      border: "border-rose-300",
      badgeBg: "bg-rose-600 text-white animate-pulse",
      text: "text-rose-950",
      icon: <AlertOctagon className="w-12 h-12 text-rose-600" />,
    },
  };

  const getSafetyInstructions = (risk: RiskLevel) => {
    if (risk === "HIGH") {
      return {
        title: "Immediate Action Required - Severe Danger",
        steps: [
          "Move immediately to designated higher grounds or safety centers away from river basins and steep cliffs.",
          "Disconnect electrical appliances and avoid wading through moving water channels.",
          "Keep emergency communications lines open and listen for official local announcements.",
        ],
      };
    } else if (risk === "MEDIUM") {
      return {
        title: "Elevated Caution - Standby for Guidance",
        steps: [
          "Secure livestock, emergency food rations, and important documentation in waterproof storage.",
          "Clear drainage gutters around homes to prevent localized flooding runoff.",
          "Avoid traveling near low-lying river bridges or steep erosion-prone hillsides.",
        ],
      };
    }
    return {
      title: "Normal Safety Conditions",
      steps: [
        "Hydrological precipitation is within normal limits.",
        "Maintain routine household drainage channels and stay informed.",
        "Report any unusual water blockage to your cell administrator.",
      ],
    };
  };

  const style = riskCardStyles[data.currentRisk];
  const safety = getSafetyInstructions(data.currentRisk);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MapPin className="w-6 h-6 text-teal-600" />
          My District Risk Dashboard ({data.name})
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {data.province} Province — Community Flood Monitoring & Emergency Preparedness
        </p>
      </div>

      {/* Main Single Card Requirement */}
      <div className={`rounded-2xl border ${style.border} ${style.cardBg} p-8 shadow-md space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {style.icon}
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Assigned Location Status
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {data.name} District
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-base font-extrabold shadow-xs ${style.badgeBg}`}>
              {data.currentRisk} FLOOD RISK
            </span>
          </div>
        </div>

        {/* What To Do Safety Message */}
        <div className="bg-white/90 rounded-xl border border-slate-200/80 p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            What To Do ({safety.title})
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {safety.steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Telemetry Summary */}
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-600 border-t border-slate-200/60">
          <div>
            Recent Precipitation: <span className="font-bold text-slate-900">{data.latestRainfallMm} mm</span>
          </div>
          <div>
            AI Confidence: <span className="font-bold text-slate-900">{data.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Recent Alerts Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Recent Emergency Alerts for {data.name}
          </h3>
          <Link
            href="/resident/alerts"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>View All Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.recentAlerts.length === 0 ? (
          <p className="text-xs text-slate-400">No emergency warnings issued for your district.</p>
        ) : (
          <div className="space-y-3">
            {data.recentAlerts.map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {a.riskLevel} RISK ALERT
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(a.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-slate-800 font-medium leading-relaxed mt-1">
                  {a.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
