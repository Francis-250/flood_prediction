"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  MapPin,
  Droplets,
  Mountain,
  Gauge,
  BrainCircuit,
  Bell,
  PlusCircle,
  ArrowLeft,
  Calendar,
  ShieldAlert,
  History,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { RiskLevel } from "@prisma/client";
import FormDrawer from "@/components/FormDrawer";

interface DistrictDetail {
  id: string;
  name: string;
  province: string;
  elevation: number | null;
  slope: number | null;
  currentRisk: RiskLevel;
  cells: { id: string; name: string }[];
  rainfallRecords: {
    id: string;
    date: string;
    rainfallMm: number;
    soilSaturation: number | null;
    notes: string | null;
  }[];
  predictions: {
    id: string;
    riskLevel: RiskLevel;
    confidence: number;
    reasoning: string | null;
    createdAt: string;
  }[];
  alerts: {
    id: string;
    riskLevel: RiskLevel;
    message: string;
    sentAt: string;
  }[];
  latestPrediction?: {
    riskLevel: RiskLevel;
    confidence: number;
    reasoning: string;
  } | null;
  rainfallTrend: {
    date: string;
    rainfallMm: number;
    soilSaturation: number;
  }[];
}

export default function OfficialDistrictDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [district, setDistrict] = useState<DistrictDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FormDrawer State for Manual Rainfall Entry
  const [isDataDrawerOpen, setIsDataDrawerOpen] = useState(false);
  const [rainDate, setRainDate] = useState(new Date().toISOString().split("T")[0]);
  const [rainfallMm, setRainfallMm] = useState("");
  const [soilSaturation, setSoilSaturation] = useState("65");
  const [notes, setNotes] = useState("");
  const [dataSaving, setDataSaving] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const fetchDistrict = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/official/districts/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDistrict(data.data);
      } else {
        setError(data.error || "District not found");
      }
    } catch {
      setError("Failed to load district details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistrict();
  }, [id]);

  const handleAddRainfall = async (e: React.FormEvent) => {
    e.preventDefault();
    setDataError(null);
    setDataSaving(true);

    try {
      const res = await fetch(`/api/official/districts/${id}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rainDate,
          rainfallMm: Number(rainfallMm),
          soilSaturation: soilSaturation ? Number(soilSaturation) : null,
          notes,
        }),
      });

      const resData = await res.json();
      setDataSaving(false);

      if (!res.ok || !resData.success) {
        setDataError(resData.error || "Failed to save record");
        return;
      }

      setIsDataDrawerOpen(false);
      setRainfallMm("");
      setNotes("");
      fetchDistrict();
    } catch (err: any) {
      setDataError("Network error. Please try again.");
      setDataSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading district telemetry...</div>;
  }

  if (error || !district) {
    return (
      <div className="p-8 text-center text-rose-600">
        <p className="font-bold">{error || "District not found"}</p>
        <Link href="/official/districts" className="text-sm underline mt-2 inline-block">
          Return to Districts list
        </Link>
      </div>
    );
  }

  const latestRain = district.rainfallRecords[0];

  const riskBannerStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-600 text-white shadow-md",
    MEDIUM: "bg-amber-500 text-white shadow-md",
    HIGH: "bg-rose-600 text-white shadow-md animate-pulse",
  };

  const riskBadgeStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {district.name} District
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {district.province} Province
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Hydrological monitoring, rainfall trends, and AI risk prediction
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDataDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Rainfall Data</span>
          </button>
          <Link
            href={`/official/alerts/new?districtId=${district.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Trigger Alert</span>
          </Link>
        </div>
      </div>

      {/* Top Risk Badge Banner */}
      <div className={`p-6 rounded-2xl flex items-center justify-between ${riskBannerStyles[district.currentRisk]}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold opacity-90">
              Current Flood Risk Status
            </div>
            <div className="text-2xl font-black tracking-tight mt-0.5">
              {district.currentRisk} FLOOD RISK
            </div>
          </div>
        </div>

        {district.latestPrediction && (
          <div className="hidden sm:block text-right bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">
            <div className="text-xs opacity-90">AI Model Confidence</div>
            <div className="text-xl font-extrabold">{district.latestPrediction.confidence}%</div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recent Rainfall (24h)
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {latestRain ? `${latestRain.rainfallMm} mm` : "0 mm"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {latestRain
                ? new Date(latestRain.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "No telemetry"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Elevation & Terrain Slope
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {district.elevation ? `${district.elevation}m` : "N/A"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Slope: <span className="font-semibold text-slate-700">{district.slope ? `${district.slope}°` : "N/A"}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Mountain className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Est. Soil Saturation
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {latestRain?.soilSaturation ? `${latestRain.soilSaturation}%` : "60%"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Basin capacity estimate</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* AI Risk Analysis Panel */}
      {district.latestPrediction && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BrainCircuit className="w-5 h-5 text-teal-600" />
            Groq AI Hydrological Risk Evaluation
          </h2>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskBadgeStyles[district.latestPrediction.riskLevel]}`}>
                {district.latestPrediction.riskLevel} RISK CLASSIFICATION
              </span>
              <span className="text-xs font-bold text-slate-600">
                Confidence: {district.latestPrediction.confidence}%
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {district.latestPrediction.reasoning}
            </p>
          </div>
        </div>
      )}

      {/* Rainfall Trend Line Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          Rainfall & Soil Saturation Trend (Last 14 Days)
        </h2>

        {district.rainfallTrend && district.rainfallTrend.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={district.rainfallTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis yAxisId="left" label={{ value: "Rainfall (mm)", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#0284c7" } }} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: "Soil Saturation (%)", angle: 90, position: "insideRight", style: { fontSize: 12, fill: "#d97706" } }} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", borderColor: "#cbd5e1", fontSize: "12px" }} />
                <Line yAxisId="left" type="monotone" dataKey="rainfallMm" stroke="#0284c7" strokeWidth={3} name="Rainfall (mm)" dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="soilSaturation" stroke="#d97706" strokeWidth={2} strokeDasharray="5 5" name="Soil Saturation (%)" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">No historical trend data available</div>
        )}
      </div>

      {/* 100vh Fixed Right Drawer: MANUAL RAINFALL ENTRY */}
      <FormDrawer
        isOpen={isDataDrawerOpen}
        onClose={() => setIsDataDrawerOpen(false)}
        title={`Add Telemetry for ${district.name}`}
        subtitle="Input daily precipitation telemetry and soil saturation metrics"
      >
        {dataError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        <form onSubmit={handleAddRainfall} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Telemetry Date
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={rainDate}
                onChange={(e) => setRainDate(e.target.value)}
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
                placeholder="e.g. Continuous heavy downpour since morning."
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDataDrawerOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={dataSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{dataSaving ? "Saving..." : "Save Telemetry Data"}</span>
            </button>
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
