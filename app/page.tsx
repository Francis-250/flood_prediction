import React from "react";
import Link from "next/link";
import {
  CloudRain,
  ShieldAlert,
  BrainCircuit,
  MapPin,
  UploadCloud,
  Bell,
  Users,
  ArrowRight,
  CheckCircle2,
  Activity,
  Droplets,
  Mountain,
  Gauge,
  ChevronRight,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RiskLevel } from "@prisma/client";

export default async function LandingPage() {
  const session = await getSession();

  // Fetch sample districts for the live preview section
  const previewDistricts = await prisma.district.findMany({
    take: 6,
    include: {
      predictions: { orderBy: { createdAt: "desc" }, take: 1 },
      rainfallRecords: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const totalDistricts = await prisma.district.count();
  const totalAlerts = await prisma.alert.count();

  let userDashboardUrl = "/auth/login";
  if (session) {
    if (session.role === "ADMIN") userDashboardUrl = "/admin";
    else if (session.role === "OFFICIAL") userDashboardUrl = "/official";
    else userDashboardUrl = "/resident";
  }

  const riskBadgeStyles: Record<RiskLevel, string> = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white flex flex-col">
      {/* Top Banner if logged in */}
      {session && (
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2">
          <span>Signed in as <strong>{session.name}</strong> ({session.role})</span>
          <Link
            href={userDashboardUrl}
            className="underline hover:text-slate-100 ml-2 font-bold inline-flex items-center gap-1"
          >
            Go to your Portal Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight block">
              Rwanda Flood Guard
            </span>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
              National AI Flood Prediction Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <Link
              href={userDashboardUrl}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2"
            >
              <span>Go to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white text-sm font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2"
              >
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 lg:px-12 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold tracking-wide">
          <ShieldAlert className="w-4 h-4 text-teal-400" />
          <span>National Early Warning & Hydrological Risk Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          AI-Powered Flood Risk Forecasting for <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Rwanda</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Integrating Groq LLM intelligence with meteorological rainfall telemetry, soil saturation estimates, and topographical slope models across all administrative districts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href={session ? userDashboardUrl : "/auth/register"}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-base shadow-xl shadow-teal-600/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>{session ? "Enter Your Dashboard" : "Get Started - Register Portal"}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-base transition-colors"
          >
            Sign In with Existing Account
          </Link>
        </div>

        {/* Platform Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto text-left">
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-xs">
            <MapPin className="w-6 h-6 text-teal-400 mb-2" />
            <div className="text-2xl font-black text-white">{totalDistricts || 30}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Districts Monitored</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-xs">
            <BrainCircuit className="w-6 h-6 text-cyan-400 mb-2" />
            <div className="text-2xl font-black text-white">Groq LLM</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-0.5">AI Prediction Engine</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-xs">
            <Activity className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-2xl font-black text-white">24/7 Sync</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Precipitation Telemetry</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-xs">
            <Bell className="w-6 h-6 text-rose-400 mb-2" />
            <div className="text-2xl font-black text-white">{totalAlerts || 12}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Dispatched Warnings</div>
          </div>
        </div>
      </section>

      {/* Live Monitored Districts Preview Section */}
      <section className="bg-slate-950 py-20 px-6 lg:px-12 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Live District Flood Risk Status
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Real-time classification based on terrain elevation, slope gradient, and rainfall accumulation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewDistricts.map((d) => {
              const latestPred = d.predictions[0];
              const latestRain = d.rainfallRecords[0];
              let risk: RiskLevel = latestPred ? latestPred.riskLevel : RiskLevel.LOW;
              if (!latestPred && latestRain) {
                if (latestRain.rainfallMm > 80) risk = RiskLevel.HIGH;
                else if (latestRain.rainfallMm > 40) risk = RiskLevel.MEDIUM;
              }

              return (
                <div
                  key={d.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 hover:border-teal-500/50 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{d.name}</h3>
                      <p className="text-xs text-slate-400">{d.province} Province</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${riskBadgeStyles[risk]}`}
                    >
                      {risk} RISK
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Rainfall</span>
                      <span className="font-semibold text-cyan-400 flex items-center gap-1 mt-0.5">
                        <Droplets className="w-3.5 h-3.5" />
                        {latestRain ? `${latestRain.rainfallMm} mm` : "N/A"}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Elevation / Slope</span>
                      <span className="font-semibold text-slate-300 mt-0.5 block">
                        {d.elevation ? `${d.elevation}m` : "N/A"} | {d.slope ? `${d.slope}°` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Portal Showcase Section */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Role-Based Access Control Architecture
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Tailored workflows for government officials, local residents, and system administrators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Government Officials */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/80 p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Government Officials</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Full district monitoring controls: upload bulk telemetry datasets via Excel/CSV, run AI flood predictions, and trigger emergency warning alerts.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-700/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Bulk CSV/Excel dataset ingestion</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Run Groq AI hydrological simulations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Broadcast emergency district alerts</span>
              </li>
            </ul>
          </div>

          {/* Local Residents */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/80 p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Local Residents</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Read-only safety portal tailored to their assigned district. View current flood risk badges, tailored action guidelines, and emergency alerts.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-700/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Single-card assigned district status</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Clear safety and evacuation guidelines</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Instant broadcast alert inbox</span>
              </li>
            </ul>
          </div>

          {/* System Administrators */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/80 p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">System Administrators</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Comprehensive user management: create, edit, activate or deactivate accounts, assign role permissions, and manage platform parameters.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-700/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>User creation & role management</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Account activation / deactivation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Platform settings & AI thresholds</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <CloudRain className="w-5 h-5 text-teal-500" />
            <span className="font-bold text-slate-300">Rwanda Flood Guard &copy; 2026</span>
            <span>- All Rights Reserved</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="hover:text-teal-400 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="hover:text-teal-400 transition-colors">
              Register
            </Link>
            <span className="text-slate-600">Disaster Resilience Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
