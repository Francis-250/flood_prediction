"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, PlusCircle, ShieldAlert, Clock, MapPin, Search, Filter } from "lucide-react";
import { RiskLevel } from "@prisma/client";

interface AlertItem {
  id: string;
  riskLevel: RiskLevel;
  message: string;
  simulated: boolean;
  sentAt: string;
  district: { id: string; name: string; province: string };
  triggeredBy?: { id: string; name: string } | null;
}

export default function OfficialAlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("");

  useEffect(() => {
    fetch("/api/official/alerts")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setAlerts(data.data);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = alerts.filter((a) => (!riskFilter ? true : a.riskLevel === riskFilter));

  const riskBadgeStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-600" />
            Flood Risk Warning Alerts Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            History of dispatched public emergency alerts and simulated risk warnings
          </p>
        </div>
        <Link
          href="/official/alerts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-xs transition-colors"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Simulate / Trigger New Alert</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-medium">Filter by Risk:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Alerts ({alerts.length})</option>
            <option value="HIGH">HIGH Risk Alerts</option>
            <option value="MEDIUM">MEDIUM Risk Alerts</option>
            <option value="LOW">LOW Risk Alerts</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading emergency alert log...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No alerts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">District</th>
                  <th className="px-6 py-3.5">Risk Level</th>
                  <th className="px-6 py-3.5">Alert Message</th>
                  <th className="px-6 py-3.5">Mode</th>
                  <th className="px-6 py-3.5">Issued By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(a.sentAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {a.district.name} ({a.district.province})
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border ${riskBadgeStyles[a.riskLevel]}`}
                      >
                        {a.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 leading-relaxed max-w-md">
                      {a.message}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {a.simulated ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                          Simulated
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                          LIVE EMERGENCY
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {a.triggeredBy?.name || "Official Command"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
