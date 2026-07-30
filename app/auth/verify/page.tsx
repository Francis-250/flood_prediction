"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CloudRain, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("No verification token provided.");
      return;
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setSuccess(true);
          setMessage(data.message || "Email address verified successfully!");
        } else {
          setSuccess(false);
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setLoading(false);
        setSuccess(false);
        setMessage("Network error during verification.");
      });
  }, [token]);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md mx-auto mb-4">
        <CloudRain className="w-7 h-7" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Email Verification
      </h1>

      {loading ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Verifying your account...</p>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{message}</p>
          <div className="pt-4">
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <XCircle className="w-7 h-7" />
          </div>
          <p className="text-sm text-rose-700 leading-relaxed font-medium">{message}</p>
          <div className="pt-4">
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm shadow-md transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 mt-2">Loading...</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
