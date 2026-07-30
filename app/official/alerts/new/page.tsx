"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, MapPin, ShieldAlert, ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { RiskLevel } from "@prisma/client";

function CreateAlertForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDistrictId = searchParams.get("districtId") || "";

  const [districts, setDistricts] = useState<{ id: string; name: string; province: string }[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(defaultDistrictId);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.HIGH);
  const [message, setMessage] = useState("");
  const [simulated, setSimulated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/official/districts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDistricts(data.data);
          if (!selectedDistrictId && data.data.length > 0) {
            setSelectedDistrictId(data.data[0].id);
          }
        }
      });
  }, []);

  const handlePresetMessage = (level: RiskLevel) => {
    const selectedDist = districts.find((d) => d.id === selectedDistrictId);
    const dName = selectedDist ? selectedDist.name : "Target District";

    if (level === RiskLevel.HIGH) {
      setMessage(`CRITICAL FLOOD ALERT: Extreme precipitation recorded in ${dName}. High risk of landslide and river overflow. Evacuate low basin areas immediately.`);
    } else if (level === RiskLevel.MEDIUM) {
      setMessage(`FLOOD WARNING: Elevated rain volume in ${dName}. Monitor drainage pathways and avoid crossing flooded stream crossings.`);
    } else {
      setMessage(`ADVISORY: Minor rainfall advisory in ${dName}. Hydrological conditions remain within normal thresholds.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedDistrictId) {
      setError("Please select a target district.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/official/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: selectedDistrictId,
          riskLevel,
          message,
          simulated,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to issue alert");
        return;
      }

      setSuccess("Flood warning alert issued successfully!");
      setTimeout(() => {
        router.push("/official/alerts");
      }, 1200);
    } catch (err: any) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/official/alerts"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Trigger / Simulate Emergency Alert
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Issue flood warning broadcasts to resident portals and alert monitoring logs
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-teal-800 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target District *
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
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
                  className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
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
              id="simulated"
              checked={simulated}
              onChange={(e) => setSimulated(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded-xs border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="simulated" className="text-sm font-medium text-slate-700">
              Simulation Mode (Testing & Training Drill)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/official/alerts"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Broadcasting..." : "Broadcast Alert"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OfficialNewAlertPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-8 text-center text-slate-500">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
      </div>
    }>
      <CreateAlertForm />
    </Suspense>
  );
}
