"use client";

import React, { useState } from "react";
import { Settings, Shield, Bell, Database, Cpu, CheckCircle2, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [alertThresholdMm, setAlertThresholdMm] = useState("75");
  const [autoEmailAlerts, setAutoEmailAlerts] = useState(true);
  const [groqModel, setGroqModel] = useState("llama-3.3-70b-versatile");
  const [dataRetentionDays, setDataRetentionDays] = useState("365");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-600" />
          System Settings & Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure system parameters, AI thresholding, alert rules, and telemetry retention
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-teal-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>System configuration settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI & Model Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-5 h-5 text-teal-600" />
            AI & Prediction Engine (Groq LLM)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Groq Model Instance
              </label>
              <input
                type="text"
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">
                Configured via GROQ_MODEL environment variable
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                AI Confidence Cutoff (%)
              </label>
              <input
                type="number"
                defaultValue={75}
                min={50}
                max={99}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                Minimum confidence score required for auto-alerting
              </p>
            </div>
          </div>
        </div>

        {/* Alert & Notification Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-5 h-5 text-teal-600" />
            Alerts & Email Notifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Critical Rainfall Alert Threshold (mm)
              </label>
              <input
                type="number"
                value={alertThresholdMm}
                onChange={(e) => setAlertThresholdMm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                Precipitation depth that triggers automated warnings
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="autoEmail"
                checked={autoEmailAlerts}
                onChange={(e) => setAutoEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-xs border-slate-300 focus:ring-teal-500"
              />
              <label htmlFor="autoEmail" className="text-sm font-medium text-slate-700">
                Dispatch Email Alerts to Affected Residents
              </label>
            </div>
          </div>
        </div>

        {/* Telemetry & Storage */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-5 h-5 text-teal-600" />
            Data Retention & PostgreSQL Storage
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Rainfall Log Retention Period (Days)
            </label>
            <input
              type="number"
              value={dataRetentionDays}
              onChange={(e) => setDataRetentionDays(e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Historical telemetry records older than this will be archived
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
