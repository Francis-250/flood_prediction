import React from "react";
import Link from "next/link";
import { Users, UserCheck, ShieldAlert, UserPlus, ArrowRight, Activity, Clock } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const totalUsers = await prisma.user.count();
  const activeOfficials = await prisma.user.count({
    where: { role: "OFFICIAL", isActive: true },
  });
  const activeResidents = await prisma.user.count({
    where: { role: "RESIDENT", isActive: true },
  });
  const activeAdmins = await prisma.user.count({
    where: { role: "ADMIN", isActive: true },
  });

  const recentUsers = await prisma.user.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      district: { select: { name: true } },
    },
  });

  const roleStyles: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    OFFICIAL: "bg-teal-100 text-teal-800 border-teal-200",
    RESIDENT: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admin Overview Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system access, user roles, and platform health
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Users
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{totalUsers}</h3>
            <p className="text-xs text-slate-400 mt-1">Registered accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Officials
            </p>
            <h3 className="text-3xl font-extrabold text-teal-700 mt-2">{activeOfficials}</h3>
            <p className="text-xs text-slate-400 mt-1">District data managers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Residents
            </p>
            <h3 className="text-3xl font-extrabold text-sky-700 mt-2">{activeResidents}</h3>
            <p className="text-xs text-slate-400 mt-1">Public subscribers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              System Administrators
            </p>
            <h3 className="text-3xl font-extrabold text-purple-700 mt-2">{activeAdmins}</h3>
            <p className="text-xs text-slate-400 mt-1">Full system access</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent User Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Recent User Registrations & Activity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest accounts created across Rwanda Flood Guard
            </p>
          </div>
          <Link
            href="/admin/users"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Assigned District</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        roleStyles[u.role] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {u.district?.name || <span className="text-slate-400 italic">None</span>}
                  </td>
                  <td className="px-6 py-4">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
