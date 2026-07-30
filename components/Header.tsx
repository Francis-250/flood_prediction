"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudRain, LogOut, User as UserIcon, Menu, X, ShieldAlert } from "lucide-react";
import { Role } from "@prisma/client";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: Role;
    districtName?: string | null;
  } | null;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function Header({
  user,
  onMobileMenuToggle,
  isMobileMenuOpen = false,
}: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Failed to log out", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const roleBadgeStyles: Record<Role, string> = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    OFFICIAL: "bg-teal-100 text-teal-800 border-teal-200",
    RESIDENT: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            type="button"
            aria-label="Toggle mobile menu"
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-xs group-hover:from-teal-700 group-hover:to-cyan-800 transition-colors">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                Rwanda Flood Guard
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider hidden sm:block">
              National Flood Prediction System
            </p>
          </div>
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              {user.name}
            </span>
            {user.districtName && (
              <span className="text-xs text-slate-500 font-normal">
                District: {user.districtName}
              </span>
            )}
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              roleBadgeStyles[user.role] || "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {user.role}
          </span>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline font-medium">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
