"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  MapPin,
  PlusCircle,
  UploadCloud,
  Bell,
  BrainCircuit,
  LogOut,
  CloudRain,
} from "lucide-react";
import { Role } from "@prisma/client";

interface SidebarProps {
  role: Role;
  isCollapsed?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export default function Sidebar({
  role,
  isCollapsed = false,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const adminNav: NavItem[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const officialNav: NavItem[] = [
    { label: "Dashboard", href: "/official", icon: LayoutDashboard, exact: true },
    { label: "Districts", href: "/official/districts", icon: MapPin, exact: true },
    { label: "Add District", href: "/official/districts/new", icon: PlusCircle },
    { label: "Upload Dataset", href: "/official/districts/upload", icon: UploadCloud },
    { label: "Alerts", href: "/official/alerts", icon: Bell },
    { label: "Run Prediction", href: "/official/predict", icon: BrainCircuit },
  ];

  const residentNav: NavItem[] = [
    { label: "My District", href: "/resident", icon: MapPin, exact: true },
    { label: "Alerts", href: "/resident/alerts", icon: Bell },
  ];

  const navItems =
    role === "ADMIN"
      ? adminNav
      : role === "OFFICIAL"
      ? officialNav
      : residentNav;

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* 100vh Fixed Left Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? "md:w-16 w-64" : "w-64"
        } ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Sidebar Top Brand Header */}
          <div className="h-16 border-b border-slate-800 flex items-center px-3.5 gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-3 group overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <CloudRain className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <span className="font-extrabold text-white text-base tracking-tight block">
                    Flood Guard
                  </span>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                    Rwanda System
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-4">
            {!isCollapsed && (
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 block">
                {role} Menu
              </span>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                      isCollapsed
                        ? "justify-center p-2.5"
                        : "px-3 py-2.5"
                    } ${
                      active
                        ? "bg-teal-600 text-white shadow-xs font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        active ? "text-white" : "text-slate-400"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom Footer Logout */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-950/40 hover:text-rose-300 border border-transparent hover:border-rose-900/50 transition-all cursor-pointer disabled:opacity-50 ${
              isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            }`}
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-300 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
