"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, PlusCircle, Search, Filter, ChevronRight, Droplets, Mountain, Globe, AlertCircle, Plus } from "lucide-react";
import { RiskLevel } from "@prisma/client";
import { getProvincesWithDistricts, getDistrictInfo } from "@/lib/location";
import FormDrawer from "@/components/FormDrawer";

interface DistrictItem {
  id: string;
  name: string;
  province: string;
  elevation: number | null;
  slope: number | null;
  cellCount: number;
  currentRisk: RiskLevel;
  latestRainfallMm: number;
  latestRainfallDate: string | null;
}

export default function OfficialDistrictsPage() {
  const provincesWithDistricts = getProvincesWithDistricts();

  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  // Drawer state for Add District
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(provincesWithDistricts[0]?.province || "");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [elevation, setElevation] = useState("1800");
  const [slope, setSlope] = useState("16");
  const [latitude, setLatitude] = useState("-1.60");
  const [longitude, setLongitude] = useState("29.60");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/official/districts");
      const data = await res.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (err) {
      console.error("Failed to load districts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  const districtsForProvince =
    provincesWithDistricts.find((p) => p.province === selectedProvince)?.districts || [];

  const handleDistrictChange = (name: string) => {
    setSelectedDistrictName(name);
    const info = getDistrictInfo(name);
    if (info) {
      setSelectedProvince(info.province);
    }
  };

  const handleAddDistrict = async (e: React.FormEvent) => {
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

      setIsAddDrawerOpen(false);
      setSelectedDistrictName("");
      fetchDistricts();
    } catch (err: any) {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  const filtered = districts.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.province.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = !riskFilter || d.currentRisk === riskFilter;
    return matchesSearch && matchesRisk;
  });

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Monitored Districts Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View all administrative districts, topographical attributes, and flood risk status
          </p>
        </div>
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New District</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search district or province..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Districts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading districts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No districts match criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">District</th>
                  <th className="px-6 py-3.5">Province</th>
                  <th className="px-6 py-3.5">Current Risk</th>
                  <th className="px-6 py-3.5">Elevation & Slope</th>
                  <th className="px-6 py-3.5">Latest Rain (24h)</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-xs text-slate-400">{d.cellCount} registered cells</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{d.province}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${riskBadgeStyles[d.currentRisk]}`}
                      >
                        {d.currentRisk}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {d.elevation ? `${d.elevation}m` : "N/A"} elevation | {d.slope ? `${d.slope}°` : "N/A"} slope
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 flex items-center gap-1 text-xs">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        {d.latestRainfallMm} mm
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/official/districts/${d.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 100vh Fixed Right Drawer: ADD DISTRICT */}
      <FormDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Add Monitored District"
        subtitle="Register an official Rwanda administrative district"
      >
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAddDistrict} className="space-y-5">
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

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? "Creating..." : "Save District"}</span>
            </button>
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
