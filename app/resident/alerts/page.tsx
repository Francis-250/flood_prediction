"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Clock, MapPin, ArrowLeft, ShieldAlert } from "lucide-react";
import { RiskLevel } from "@prisma/client";

interface ResidentAlert {
  id: string;
  riskLevel: RiskLevel;
  message: string;
  sentAt: string;
  district: { id: string; name: string; province: string };
}

export default function ResidentAlertsPage() {
  const [alerts, setAlerts] = useState<ResidentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resident/alerts")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setAlerts(data.data);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const riskBadgeStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <Link
          href="/resident"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-600" />
            Received Emergency Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official warning broadcasts dispatched to your district
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading emergency alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No emergency warnings issued</p>
            <p className="text-xs text-slate-400 mt-1">Your district currently has no active flood alerts.</p>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3 hover:border-teal-300 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${riskBadgeStyles[a.riskLevel]}`}>
                    {a.riskLevel} FLOOD WARNING
                  </span>
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    {a.district.name} ({a.district.province})
                  </span>
                </div>

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(a.sentAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {a.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
