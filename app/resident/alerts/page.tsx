"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Clock, MapPin, ArrowLeft, ShieldAlert, Navigation, Filter } from "lucide-react";
import { RiskLevel } from "@prisma/client";

interface ResidentAlert {
  id: string;
  riskLevel: RiskLevel;
  message: string;
  simulated: boolean;
  sentAt: string;
  district: { id: string; name: string; province: string };
}

export default function ResidentAlertsPage() {
  const [alerts, setAlerts] = useState<ResidentAlert[]>([]);
  const [homeDistrictId, setHomeDistrictId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"ALL" | "HOME" | "NATIONWIDE">("ALL");

  useEffect(() => {
    fetch("/api/resident/alerts")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setAlerts(data.data);
          setHomeDistrictId(data.homeDistrictId || null);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filterMode === "HOME") return a.district.id === homeDistrictId;
    if (filterMode === "NATIONWIDE") return a.district.id !== homeDistrictId;
    return true;
  });

  const riskBadgeStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-600" />
            Emergency Warnings Inbox
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official flood warning broadcasts for your home district & nationwide travel alerts
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter View:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === "ALL"
                ? "bg-teal-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Broadcasts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterMode("HOME")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === "HOME"
                ? "bg-teal-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Home District Only
          </button>
          <button
            onClick={() => setFilterMode("NATIONWIDE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === "NATIONWIDE"
                ? "bg-teal-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Travel & Other Districts
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading emergency warnings...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No warnings match selected filter</p>
            <p className="text-xs text-slate-400 mt-1">There are currently no active flood alerts for this view.</p>
          </div>
        ) : (
          filteredAlerts.map((a) => {
            const isHome = a.district.id === homeDistrictId;
            return (
              <div
                key={a.id}
                className={`bg-white rounded-xl border p-6 shadow-xs space-y-3 transition-all ${
                  isHome ? "border-teal-300 shadow-sm" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold border ${riskBadgeStyles[a.riskLevel]}`}
                    >
                      {a.riskLevel} FLOOD WARNING
                    </span>

                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      {a.district.name} ({a.district.province})
                    </span>

                    {isHome ? (
                      <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                        MY HOME DISTRICT
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-amber-600" />
                        TRAVEL / OTHER DISTRICT
                      </span>
                    )}
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
            );
          })
        )}
      </div>
    </div>
  );
}
