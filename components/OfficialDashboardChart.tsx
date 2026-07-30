"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";

interface TelemetryPoint {
  districtName: string;
  rainfallMm: number;
  soilSaturation: number;
}

interface OfficialDashboardChartProps {
  data: TelemetryPoint[];
}

export default function OfficialDashboardChart({ data }: OfficialDashboardChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No active district telemetry data available to plot chart.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          Real-Time Monitored District Telemetry Line Chart
        </h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {data.length} Districts Monitored
        </span>
      </div>

      <div className="h-80 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="districtName" tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }} />
            <YAxis
              yAxisId="left"
              label={{
                value: "Rainfall (mm)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#0284c7", fontWeight: 600 },
              }}
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: "Soil Saturation (%)",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 12, fill: "#d97706", fontWeight: 600 },
              }}
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                borderColor: "#cbd5e1",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rainfallMm"
              stroke="#0284c7"
              strokeWidth={3}
              name="Rainfall (mm)"
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="soilSaturation"
              stroke="#d97706"
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Soil Saturation (%)"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
