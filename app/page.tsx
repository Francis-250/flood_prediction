import React from "react";
import Link from "next/link";
import {
  CloudRain,
  MapPin,
  Bell,
  Users,
  ArrowRight,
  CheckCircle2,
  Activity,
  Droplets,
  BrainCircuit,
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
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Banner if logged in */}
      {session && (
        <div className="bg-teal-700 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 border-b border-teal-800">
          <span>Signed in as <strong>{session.name}</strong> ({session.role})</span>
          <Link
            href={userDashboardUrl}
            className="underline hover:text-teal-100 ml-2 font-bold inline-flex items-center gap-1"
          >
            Go to Portal Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Navigation Header matching portal style */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block">
              Rwanda Flood Guard
            </span>
            <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
              National Flood Prediction Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href={userDashboardUrl}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <span>Go to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-200 text-sm font-semibold transition-colors border border-slate-300 bg-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section - Clean Corporate Style (No gradients, no shadows, no top badge) */}
      <section className="pt-16 pb-20 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Flood Risk Forecasting & Early Warning System for Rwanda
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Integrating Groq AI intelligence with meteorological rainfall telemetry, soil saturation estimates, and topographical slope models across all administrative districts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href={session ? userDashboardUrl : "/auth/register"}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{session ? "Enter Your Dashboard" : "Register Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
          >
            Sign In to Portal
          </Link>
        </div>

        {/* Platform Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left">
          <div className="p-5 rounded-xl bg-white border border-slate-200">
            <MapPin className="w-5 h-5 text-teal-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{totalDistricts || 30}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Districts Monitored</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200">
            <BrainCircuit className="w-5 h-5 text-teal-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">Groq LLM</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">AI Prediction Engine</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200">
            <Activity className="w-5 h-5 text-teal-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">24/7 Sync</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Telemetry Ingestion</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200">
            <Bell className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{totalAlerts || 12}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Dispatched Warnings</div>
          </div>
        </div>
      </section>

      {/* Live Monitored Districts Preview Section */}
      <section className="bg-white py-16 px-6 lg:px-12 border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Live District Risk Status Directory
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Real-time classification based on terrain elevation, slope gradient, and rainfall accumulation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{d.name}</h3>
                      <p className="text-xs text-slate-500">{d.province} Province</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskBadgeStyles[risk]}`}
                    >
                      {risk} RISK
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Rainfall</span>
                      <span className="font-semibold text-blue-700 flex items-center gap-1 mt-0.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        {latestRain ? `${latestRain.rainfallMm} mm` : "N/A"}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Elevation / Slope</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
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
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Role-Based System Access
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tailored workflows for government officials, local residents, and system administrators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Government Officials */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Government Officials</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              District monitoring controls: bulk file telemetry dataset upload, AI flood predictions, and emergency warning alert dispatch.
            </p>
            <ul className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Bulk CSV/Excel dataset ingestion</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Groq AI hydrological simulations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Emergency warnings dispatch</span>
              </li>
            </ul>
          </div>

          {/* Local Residents */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Local Residents</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Safety portal tailored to their home district: current flood risk status, safety action guidelines, and emergency inbox.
            </p>
            <ul className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Single-card home district status</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Clear safety and evacuation steps</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Travel & district warnings inbox</span>
              </li>
            </ul>
          </div>

          {/* System Administrators */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">System Administrators</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              User management: create, edit, activate or deactivate accounts, assign role permissions, and configure system thresholds.
            </p>
            <ul className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>User creation & role management</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Account activation / deactivation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Platform parameters & thresholds</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800">Rwanda Flood Guard &copy; 2026</span>
            <span>- All Rights Reserved</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="hover:text-teal-600 transition-colors font-medium">
              Sign In
            </Link>
            <Link href="/auth/register" className="hover:text-teal-600 transition-colors font-medium">
              Register
            </Link>
            <span className="text-slate-400">Flood Telemetry & AI Prediction</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
