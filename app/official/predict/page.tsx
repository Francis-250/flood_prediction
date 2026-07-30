"use client";

import React, { useEffect, useState } from "react";
import { BrainCircuit, MapPin, Droplets, Calendar, Mountain, Gauge, Sparkles, AlertCircle, ShieldAlert } from "lucide-react";
import { RiskLevel } from "@prisma/client";

interface DistrictItem {
  id: string;
  name: string;
  province: string;
  elevation: number | null;
  slope: number | null;
}

interface PredictionResult {
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string;
}

export default function OfficialPredictPage() {
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [rainfallMm, setRainfallMm] = useState("85");
  const [daysOfRain, setDaysOfRain] = useState("3");
  const [slope, setSlope] = useState("18");
  const [soilSaturation, setSoilSaturation] = useState("75");
  const [elevation, setElevation] = useState("1800");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    fetch("/api/official/districts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setDistricts(data.data);
          const first = data.data[0];
          setSelectedDistrictId(first.id);
          if (first.slope) setSlope(String(first.slope));
          if (first.elevation) setElevation(String(first.elevation));
        }
      });
  }, []);

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const d = districts.find((item) => item.id === id);
    if (d) {
      if (d.slope) setSlope(String(d.slope));
      if (d.elevation) setElevation(String(d.elevation));
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const selectedDist = districts.find((d) => d.id === selectedDistrictId);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: selectedDistrictId,
          districtName: selectedDist ? selectedDist.name : undefined,
          rainfallMm: Number(rainfallMm),
          daysOfRain: Number(daysOfRain),
          slope: Number(slope),
          soilSaturation: Number(soilSaturation),
          elevation: Number(elevation),
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
      setError("Network error calling prediction API.");
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-teal-600" />
          AI Flood Risk Simulation & Forecasting
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Input meteorological and topographical metrics to generate instant Groq LLM flood risk evaluations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Hydrological Input Parameters
          </h2>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target District
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedDistrictId}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.province} Province)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rainfall Amount (mm)
                </label>
                <div className="relative">
                  <Droplets className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={rainfallMm}
                    onChange={(e) => setRainfallMm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Continuous Days of Rain
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    required
                    value={daysOfRain}
                    onChange={(e) => setDaysOfRain(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Terrain Slope (° Degrees)
                </label>
                <div className="relative">
                  <Mountain className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={slope}
                    onChange={(e) => setSlope(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Soil Saturation (%)
                </label>
                <div className="relative">
                  <Gauge className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={soilSaturation}
                    onChange={(e) => setSoilSaturation(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mean Elevation (Meters)
              </label>
              <input
                type="number"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Analyzing Hydrological Parameters..." : "Run AI Flood Risk Classification"}</span>
            </button>
          </form>
        </div>

        {/* Prediction Results Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              AI Prediction Output
            </h2>

            {result ? (
              <div className={`p-6 rounded-xl border ${riskCardStyles[result.riskLevel]} space-y-4`}>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${riskBadgeStyles[result.riskLevel]}`}>
                    {result.riskLevel} RISK
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold block">Confidence</span>
                    <span className="text-lg font-black text-slate-900">{result.confidence}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Hydrological Reasoning
                  </span>
                  <p className="text-sm leading-relaxed font-medium text-slate-800">
                    {result.reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <BrainCircuit className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">No prediction executed yet</p>
                <p className="text-xs text-slate-400">Fill in parameters on the left and click &quot;Run AI Flood Risk Classification&quot;.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
