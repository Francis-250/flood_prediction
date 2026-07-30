"use client";

import React, { useEffect, useState } from "react";
import { BrainCircuit, MapPin, Droplets, Calendar, Mountain, Gauge, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { RiskLevel } from "@prisma/client";

interface DistrictItem {
  id: string;
  name: string;
  province: string;
  elevation: number | null;
  slope: number | null;
  latestRainfallMm?: number;
  soilSaturation?: number;
}

interface PredictionResult {
  districtName: string;
  province: string;
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string;
  rainfallMm: number;
  daysOfRain: number;
  slope: number;
  soilSaturation: number;
  elevation: number;
}

export default function OfficialPredictPage() {
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const fetchDistricts = async () => {
    try {
      const res = await fetch("/api/official/districts");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setDistricts(data.data);
        const first = data.data[0];
        setSelectedDistrictId(first.id);
        setSelectedDistrict(first);
      }
    } catch (err) {
      console.error("Failed to load districts", err);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const d = districts.find((item) => item.id === id);
    if (d) {
      setSelectedDistrict(d);
      setResult(null);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: selectedDistrictId,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to process AI prediction.");
        return;
      }

      setResult(data.data);
    } catch (err: any) {
      setError("Network error executing prediction.");
      setLoading(false);
    }
  };

  const riskCardStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-50 border-emerald-300 text-emerald-900",
    MEDIUM: "bg-amber-50 border-amber-300 text-amber-900",
    HIGH: "bg-rose-50 border-rose-300 text-rose-900",
  };

  const riskBadgeStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-600 text-white",
    MEDIUM: "bg-amber-600 text-white",
    HIGH: "bg-rose-600 text-white animate-pulse",
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-teal-600" />
          AI Flood Risk Evaluation (Real Database Metrics)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select an administrative district to evaluate AI flood risk based on stored PostgreSQL precipitation & topographical telemetry
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* District Selector & Database Telemetry Metrics */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select District for AI Evaluation
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white font-bold"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.province} Province)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedDistrict && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                Stored Database Telemetry & Terrain Metrics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block">Latest 24h Rain</span>
                  <span className="text-base font-extrabold text-blue-700 flex items-center gap-1 mt-0.5">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    {selectedDistrict.latestRainfallMm ?? 0} mm
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block">Soil Saturation</span>
                  <span className="text-base font-extrabold text-amber-700 flex items-center gap-1 mt-0.5">
                    <Gauge className="w-4 h-4 text-amber-500" />
                    {selectedDistrict.soilSaturation ?? 60}%
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block">Mean Elevation</span>
                  <span className="text-base font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Mountain className="w-4 h-4 text-slate-500" />
                    {selectedDistrict.elevation ? `${selectedDistrict.elevation}m` : "N/A"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block">Slope Gradient</span>
                  <span className="text-base font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                    {selectedDistrict.slope ? `${selectedDistrict.slope}°` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handlePredict}>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Evaluating District Data..." : "Run AI Risk Prediction"}</span>
            </button>
          </form>
        </div>

        {/* Prediction Output Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs min-h-[380px] flex flex-col justify-between">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              AI Hydrological Evaluation Output
            </h2>

            {result ? (
              <div className={`p-6 rounded-xl border ${riskCardStyles[result.riskLevel]} space-y-4 flex-1 flex flex-col justify-between`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold opacity-70 block">Target District</span>
                      <h3 className="text-xl font-extrabold text-slate-900">{result.districtName} ({result.province})</h3>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${riskBadgeStyles[result.riskLevel]}`}>
                        {result.riskLevel} RISK
                      </span>
                      <span className="text-xs font-bold text-slate-700 block mt-1">Confidence: {result.confidence}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Hydrological Reasoning & Factors
                    </span>
                    <p className="text-sm leading-relaxed font-medium text-slate-800">
                      {result.reasoning}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
                  <span>Evaluated against stored DB metrics ({result.rainfallMm}mm rain, {result.soilSaturation}% saturation)</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 space-y-3 flex-1 flex flex-col items-center justify-center">
                <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-base font-bold text-slate-700">Ready for AI Evaluation</p>
                <p className="text-xs text-slate-500 max-w-sm">Select a district from the database on the left and click &quot;Run AI Risk Prediction&quot; to fetch real-time Groq LLM risk analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
