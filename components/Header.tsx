"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Menu, X, PanelLeftClose, PanelLeftOpen, CloudRain } from "lucide-react";
import { Role } from "@prisma/client";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: Role;
    districtName?: string | null;
  } | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function Header({
  user,
  isCollapsed = false,
  onToggleCollapse,
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
    <header
      className={`fixed top-0 right-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-3 sm:px-6 flex items-center justify-between shadow-2xs transition-all duration-300 ${
        isCollapsed ? "left-0 md:left-16" : "left-0 md:left-64"
      }`}
    >
      {/* Left controls */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Menu Toggle Button */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            type="button"
            aria-label="Toggle mobile menu"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 shrink-0 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* Mobile Brand Title */}
        <Link href="/" className="md:hidden flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-2xs">
            <CloudRain className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight hidden xs:inline">
            Flood Guard
          </span>
        </Link>

        {/* Desktop Sidebar Collapse Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            type="button"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors text-xs font-semibold cursor-pointer shrink-0"
          >
            {isCollapsed ? (
              <>
                <PanelLeftOpen className="w-4 h-4 text-teal-600" />
                <span className="hidden lg:inline">Expand Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-500" />
                <span className="hidden lg:inline">Collapse Sidebar</span>
              </>
            )}
          </button>
        )}

        <div className="hidden xl:block text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
          National Early Warning System
        </div>
      </div>

      {/* Right controls */}
      {user && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end text-right leading-tight">
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              {user.name}
            </span>
            {user.districtName && (
              <span className="text-[11px] text-slate-500 font-normal">
                {user.districtName} District
              </span>
            )}
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              roleBadgeStyles[user.role] || "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {user.role}
          </span>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
