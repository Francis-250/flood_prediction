"use client";

import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Role } from "@prisma/client";

interface UserProfile {
  name: string;
  email: string;
  role: Role;
  districtName?: string | null;
}

interface AppLayoutProps {
  user: UserProfile;
  children: React.ReactNode;
}

export default function AppLayout({ user, children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state preference
  useEffect(() => {
    const saved = localStorage.getItem("fp_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fp_sidebar_collapsed", String(next));
      return next;
    });
  };

  const isResident = user.role === Role.RESIDENT;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* Sidebar is hidden for RESIDENT users */}
      {!isResident && (
        <Sidebar
          role={user.role}
          isCollapsed={isCollapsed}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Top Header */}
      <Header
        user={user}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onMobileMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main
        style={{ marginTop: "64px" }}
        className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 min-h-[calc(100vh-4rem)] overflow-x-hidden ${
          isResident ? "ml-0 w-full" : isCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
