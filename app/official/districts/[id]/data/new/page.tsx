"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Calendar, Gauge, FileText, CheckCircle2, AlertCircle, Save } from "lucide-react";
import FormDrawer from "@/components/FormDrawer";

export default function OfficialNewRainfallRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rainfallMm, setRainfallMm] = useState("");
  const [soilSaturation, setSoilSaturation] = useState("65");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/official/districts/${id}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          rainfallMm: Number(rainfallMm),
          soilSaturation: soilSaturation ? Number(soilSaturation) : null,
          notes,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save record");
        return;
      }

      setSuccess("Rainfall telemetry recorded and AI flood risk updated!");
      setTimeout(() => {
        router.push(`/official/districts/${id}`);
      }, 800);
    } catch (err: any) {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      isOpen={true}
      onClose={() => router.push(`/official/districts/${id}`)}
      title="Manual Rainfall Telemetry Entry"
      subtitle="Input daily precipitation telemetry and soil saturation metrics"
    >
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-teal-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Telemetry Date
          </label>
          <div className="relative">
            <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Rainfall Amount (mm) *
          </label>
          <div className="relative">
            <Droplets className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="0.1"
              required
              min={0}
              value={rainfallMm}
              onChange={(e) => setRainfallMm(e.target.value)}
              placeholder="e.g. 75.5"
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Soil Saturation Estimate (%)
          </label>
          <div className="relative">
            <Gauge className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="1"
              min={0}
              max={100}
              value={soilSaturation}
              onChange={(e) => setSoilSaturation(e.target.value)}
              placeholder="e.g. 80"
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Field Observations / Notes
          </label>
          <div className="relative">
            <FileText className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Continuous heavy downpour since morning. Minor localized runoff observed."
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push(`/official/districts/${id}`)}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Telemetry..." : "Save Rainfall Data"}</span>
          </button>
        </div>
      </form>
    </FormDrawer>
  );
}
