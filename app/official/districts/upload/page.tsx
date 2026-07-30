"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Table,
  Trash2,
  Check,
  PlusCircle,
  Calendar,
  Droplets,
  Gauge,
  MapPin,
  Save,
} from "lucide-react";
import { getAllDistrictNames } from "@/lib/location";
import FormDrawer from "@/components/FormDrawer";

interface ParsedRecord {
  districtName: string;
  date: string;
  rainfallMm: number;
  soilSaturation: number;
  notes: string;
}

export default function OfficialUploadDatasetPage() {
  const router = useRouter();
  const districtList = getAllDistrictNames();

  const [parsedRows, setParsedRows] = useState<ParsedRecord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // FormDrawer State for Manual Entry
  const [isManualDrawerOpen, setIsManualDrawerOpen] = useState(false);
  const [manualDistrictName, setManualDistrictName] = useState(districtList[0] || "");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualRainfallMm, setManualRainfallMm] = useState("");
  const [manualSoilSaturation, setManualSoilSaturation] = useState("65");
  const [manualNotes, setManualNotes] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const sampleCsv = `districtName,date,rainfallMm,soilSaturation,notes
Nyabihu,2026-07-30,85.5,90,Heavy afternoon downpour
Musanze,2026-07-30,42.0,65,Moderate continuous rain
Rubavu,2026-07-30,18.0,45,Light showers near Lake Kivu
Gicumbi,2026-07-30,68.0,80,Sustained rainfall on high slopes
Gasabo,2026-07-30,22.5,50,Normal urban precipitation`;

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setError("File is empty or lacks data rows.");
      return;
    }

    const rows: ParsedRecord[] = [];
    const startIdx = lines[0].toLowerCase().includes("district") ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 3) {
        const districtName = parts[0];
        const date = parts[1] || new Date().toISOString().split("T")[0];
        const rainfallMm = Number(parts[2]) || 0;
        const soilSaturation = Number(parts[3]) || 60;
        const notes = parts[4] || "Bulk uploaded dataset";

        rows.push({ districtName, date, rainfallMm, soilSaturation, notes });
      }
    }

    if (rows.length === 0) {
      setError("No valid telemetry rows could be parsed.");
      return;
    }

    setParsedRows(rows);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) parseCsvText(content);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setFileName("sample_rwanda_flood_dataset.csv");
    parseCsvText(sampleCsv);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/official/districts/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: parsedRows }),
      });

      const data = await res.json();
      setUploading(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to import dataset.");
        return;
      }

      setResult({
        success: true,
        message: data.message,
        errors: data.errors,
      });
      setParsedRows([]);
    } catch (err: any) {
      setError("Network error. Please try again.");
      setUploading(false);
    }
  };

  const handleAddManualWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualDistrictName) {
      setManualError("Please select a target district.");
      return;
    }

    setManualSaving(true);

    const record: ParsedRecord = {
      districtName: manualDistrictName,
      date: manualDate,
      rainfallMm: Number(manualRainfallMm),
      soilSaturation: Number(manualSoilSaturation),
      notes: manualNotes || "Manually added weather reading",
    };

    try {
      const res = await fetch("/api/official/districts/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: [record] }),
      });

      const data = await res.json();
      setManualSaving(false);

      if (!res.ok || !data.success) {
        setManualError(data.error || "Failed to save manual reading.");
        return;
      }

      setResult({
        success: true,
        message: `Successfully recorded weather entry for ${manualDistrictName} (${manualDate})!`,
      });
      setIsManualDrawerOpen(false);
      setManualRainfallMm("");
      setManualNotes("");
    } catch (err: any) {
      setManualError("Network error. Please try again.");
      setManualSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/official"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Weather Telemetry Dataset Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload multi-timestamp weather datasets or manually record daily precipitation metrics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsManualDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Entry Manually</span>
          </button>
          <a
            href="/sample_rwanda_weather_dataset.csv"
            download="sample_rwanda_weather_dataset.csv"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg border border-slate-300 transition-colors inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Download Sample File (.csv)</span>
          </a>
          <button
            onClick={loadSample}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-3.5 py-2 rounded-lg border border-teal-200 cursor-pointer"
          >
            Load Sample CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="p-6 rounded-xl bg-teal-50 border border-teal-200 space-y-3">
          <div className="flex items-center gap-3 text-teal-900 font-bold text-lg">
            <CheckCircle2 className="w-6 h-6 text-teal-600" />
            <span>{result.message}</span>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="pt-2 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Warnings / Skipped Rows:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="pt-2">
            <Link
              href="/official/districts"
              className="inline-block px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
            >
              View Updated Districts Directory
            </Link>
          </div>
        </div>
      )}

      {/* Two Entry Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: File Upload Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bulk File Dataset Upload</h3>
              <p className="text-xs text-slate-500">Upload .CSV or .XLSX files with historical dates</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors">
            <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">Drag file or click below</p>

            <div className="mt-3">
              <label className="inline-block px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer">
                <span>Browse File (.csv / .xlsx)</span>
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {fileName && (
              <div className="mt-2 text-xs text-slate-600 font-semibold flex items-center justify-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span className="truncate max-w-xs">{fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Option 2: Manual Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Single Weather Entry</h3>
                <p className="text-xs text-slate-500">Manually input date, rainfall, & soil metrics</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-2">
              Record localized field observations directly for a specific district and date using our right slide-over drawer panel.
            </p>
          </div>

          <button
            onClick={() => setIsManualDrawerOpen(true)}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-teal-400" />
            <span>Open Manual Entry Drawer</span>
          </button>
        </div>
      </div>

      {/* Preview Table for Uploaded File */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-teal-600" />
              Parsed Weather Telemetry Rows ({parsedRows.length})
            </h2>
            <button
              onClick={() => setParsedRows([])}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Preview</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Rainfall (mm)</th>
                  <th className="px-4 py-3">Soil Saturation</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {parsedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{r.districtName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.date}</td>
                    <td className="px-4 py-2.5 font-semibold text-blue-700">{r.rainfallMm} mm</td>
                    <td className="px-4 py-2.5 text-amber-700">{r.soilSaturation}%</td>
                    <td className="px-4 py-2.5 text-slate-500 truncate max-w-xs">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleConfirmImport}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{uploading ? "Importing Data..." : `Confirm Import (${parsedRows.length} Rows)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* 100vh Fixed Right Drawer: MANUAL WEATHER ENTRY */}
      <FormDrawer
        isOpen={isManualDrawerOpen}
        onClose={() => setIsManualDrawerOpen(false)}
        title="Add Weather Telemetry Reading"
        subtitle="Manually record single precipitation and soil saturation observation"
      >
        {manualError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{manualError}</span>
          </div>
        )}

        <form onSubmit={handleAddManualWeather} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target District *
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={manualDistrictName}
                onChange={(e) => setManualDistrictName(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
              >
                {districtList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Weather Reading Date & Time
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
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
                value={manualRainfallMm}
                onChange={(e) => setManualRainfallMm(e.target.value)}
                placeholder="e.g. 85.5"
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
                value={manualSoilSaturation}
                onChange={(e) => setManualSoilSaturation(e.target.value)}
                placeholder="e.g. 70"
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Field Observations / Weather Notes
            </label>
            <textarea
              rows={3}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="e.g. Heavy afternoon rain with high river water runoff."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualDrawerOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={manualSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{manualSaving ? "Saving Entry..." : "Save Weather Reading"}</span>
            </button>
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
