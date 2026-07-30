"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Mountain, Globe, ArrowLeft, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { getProvincesWithDistricts, getDistrictInfo } from "@/lib/location";

export default function OfficialNewDistrictPage() {
  const router = useRouter();
  const provincesWithDistricts = getProvincesWithDistricts();

  const [selectedProvince, setSelectedProvince] = useState(provincesWithDistricts[0]?.province || "");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [elevation, setElevation] = useState("1800");
  const [slope, setSlope] = useState("16");
  const [latitude, setLatitude] = useState("-1.60");
  const [longitude, setLongitude] = useState("29.60");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const districtsForProvince =
    provincesWithDistricts.find((p) => p.province === selectedProvince)?.districts || [];

  const handleDistrictChange = (name: string) => {
    setSelectedDistrictName(name);
    const info = getDistrictInfo(name);
    if (info) {
      setSelectedProvince(info.province);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDistrictName) {
      setError("Please select a district name from Rwanda's administrative list.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/official/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedDistrictName,
          province: selectedProvince,
          elevation: Number(elevation),
          slope: Number(slope),
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create district");
        return;
      }

      router.push(`/official/districts/${data.data.id}`);
      router.refresh();
    } catch (err: any) {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/official/districts"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Add Monitored District
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Register an official Rwanda administrative district
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Province
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedDistrictName("");
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
              >
                {provincesWithDistricts.map((p) => (
                  <option key={p.province} value={p.province}>
                    {p.province} Province
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                District Name *
              </label>
              <select
                required
                value={selectedDistrictName}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
              >
                <option value="">Select District</option>
                {districtsForProvince.map((dName) => (
                  <option key={dName} value={dName}>
                    {dName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mean Elevation (Meters)
              </label>
              <div className="relative">
                <Mountain className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  placeholder="e.g. 1850"
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Average Terrain Slope (Degrees °)
              </label>
              <input
                type="number"
                step="0.1"
                value={slope}
                onChange={(e) => setSlope(e.target.value)}
                placeholder="e.g. 18.5"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Latitude Coordinate
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-1.6500"
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Longitude Coordinate
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="29.5000"
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/official/districts"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? "Creating..." : "Save Monitored District"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
