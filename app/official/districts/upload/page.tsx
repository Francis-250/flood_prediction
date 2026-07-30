"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowLeft, Table, Trash2, Check } from "lucide-react";

interface ParsedRecord {
  districtName: string;
  date: string;
  rainfallMm: number;
  soilSaturation: number;
  notes: string;
}

export default function OfficialUploadDatasetPage() {
  const router = useRouter();
  const [parsedRows, setParsedRows] = useState<ParsedRecord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    // skip header row if present
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/official"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bulk Telemetry Dataset Upload
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload .csv or .xlsx rainfall records for multiple districts simultaneously
            </p>
          </div>
        </div>

        <button
          onClick={loadSample}
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-md border border-teal-200"
        >
          Load Sample CSV
        </button>
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

      {/* Upload Drop Zone */}
      <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-teal-500 transition-colors">
        <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">Select or Drag Telemetry File</h3>
        <p className="text-xs text-slate-500 mt-1">Supports CSV or Excel files with columns: districtName, date, rainfallMm, soilSaturation</p>

        <div className="mt-4">
          <label className="inline-block px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer">
            <span>Browse Computer</span>
            <input
              type="file"
              accept=".csv,.txt,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {fileName && (
          <div className="mt-3 text-xs text-slate-600 font-semibold flex items-center justify-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Loaded: {fileName}</span>
          </div>
        )}
      </div>

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-teal-600" />
              Preview Parsed Telemetry Rows ({parsedRows.length})
            </h2>
            <button
              onClick={() => setParsedRows([])}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
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
    </div>
  );
}
