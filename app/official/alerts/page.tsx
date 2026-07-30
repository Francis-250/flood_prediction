"use client";

import React, { useEffect, useState } from "react";
import { Bell, ShieldAlert, Clock, MapPin, Filter, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { RiskLevel } from "@prisma/client";
import FormDrawer from "@/components/FormDrawer";

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
  const [districts, setDistricts] = useState<{ id: string; name: string; province: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("");

  // FormDrawer State for Trigger Alert
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [targetDistrictId, setTargetDistrictId] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.HIGH);
  const [message, setMessage] = useState("");
  const [simulated, setSimulated] = useState(true);
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/official/alerts");
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetch("/api/official/districts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setDistricts(data.data);
          setTargetDistrictId(data.data[0].id);
        }
      });
  }, []);

  const handlePresetMessage = (level: RiskLevel) => {
    const selectedDist = districts.find((d) => d.id === targetDistrictId);
    const dName = selectedDist ? selectedDist.name : "Target District";

    if (level === RiskLevel.HIGH) {
      setMessage(`CRITICAL FLOOD ALERT: Extreme precipitation recorded in ${dName}. High risk of landslide and river overflow. Evacuate low basin areas immediately.`);
    } else if (level === RiskLevel.MEDIUM) {
      setMessage(`FLOOD WARNING: Elevated rain volume in ${dName}. Monitor drainage pathways and avoid crossing flooded stream crossings.`);
    } else {
      setMessage(`ADVISORY: Minor rainfall advisory in ${dName}. Hydrological conditions remain within normal thresholds.`);
    }
  };

  const handleTriggerAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);

    if (!targetDistrictId) {
      setAlertError("Please select a target district.");
      return;
    }

    setAlertSaving(true);

    try {
      const res = await fetch("/api/official/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: targetDistrictId,
          riskLevel,
          message,
          simulated,
        }),
      });

      const data = await res.json();
      setAlertSaving(false);

      if (!res.ok || !data.success) {
        setAlertError(data.error || "Failed to issue alert");
        return;
      }

      setIsAlertDrawerOpen(false);
      setMessage("");
      fetchAlerts();
    } catch (err: any) {
      setAlertError("Network error. Please try again.");
      setAlertSaving(false);
    }
  };

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
        <button
          onClick={() => setIsAlertDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Simulate / Trigger New Alert</span>
        </button>
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

      {/* 100vh Fixed Right Drawer: TRIGGER ALERT */}
      <FormDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        title="Broadcast Emergency Warning Alert"
        subtitle="Issue flood warnings to resident portals and emergency monitoring logs"
      >
        {alertError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{alertError}</span>
          </div>
        )}

        <form onSubmit={handleTriggerAlert} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target District *
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={targetDistrictId}
                onChange={(e) => setTargetDistrictId(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
              >
                <option value="">Select Target District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.province} Province)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Risk Level Severity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => {
                    setRiskLevel(level);
                    handlePresetMessage(level);
                  }}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    riskLevel === level
                      ? level === "HIGH"
                        ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                        : level === "MEDIUM"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {level} RISK
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Broadcast Alert Message
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter flood warning details and recommended safety precautions..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="simulatedMode"
              checked={simulated}
              onChange={(e) => setSimulated(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded-xs border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="simulatedMode" className="text-sm font-medium text-slate-700">
              Simulation Mode (Testing Drill)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAlertDrawerOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={alertSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{alertSaving ? "Broadcasting..." : "Broadcast Alert"}</span>
            </button>
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
