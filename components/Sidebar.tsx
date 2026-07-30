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
  ShieldAlert,
} from "lucide-react";
import { Role } from "@prisma/client";

interface SidebarProps {
  role: Role;
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

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
              Navigation ({role})
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-teal-600 text-white shadow-xs font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-white" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-950/40 hover:text-rose-300 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-300" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
