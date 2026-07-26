"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, ShieldAlert, Award, FileText, FolderArchive, Users, CheckCircle, Download } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { analyticsService } from "@/services/analyticsService";
import { TableSkeleton } from "@/components/ui/Skeleton";

const COLORS = ["#00b4d8", "#0284c7", "#f59e0b", "#e11d48", "#10b981", "#8b5cf6"];

export default function AnalyticsPage() {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => analyticsService.getOverview(),
  });

  const data = analyticsRes?.data;

  if (isLoading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Departmental Analytics & Crime Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time metrics on spatial crime distribution, monthly resolution trends, and station performance.</p>
        </div>
        <button
          onClick={() => analyticsService.downloadAnalyticsPDF()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Departmental PDF Report</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Total Crimes Logged</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{data?.total_crimes || 0}</p>
          <p className="text-[10px] text-slate-500 font-mono">Open: {data?.open_crimes} • Under Inv: {data?.under_investigation}</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Overall Resolution Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{data?.resolution_rate || 0}%</p>
          <p className="text-[10px] text-emerald-500/80 font-mono">{data?.closed_crimes} Closed Incident Files</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">FIRs Registered</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{data?.total_firs || 0}</p>
          <p className="text-[10px] text-slate-500 font-mono">Official CrPC Filings</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Secured Evidence Assets</span>
            <FolderArchive className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{data?.total_evidences || 0}</p>
          <p className="text-[10px] text-slate-500 font-mono">Vault & Forensic Items</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Crime Trend */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Monthly Crime Incidence & Resolution Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2541" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0b132b", borderColor: "#1c2541", fontSize: "12px" }} />
                <Bar dataKey="total_crimes" fill="#0284c7" name="Total Incidents" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved Files" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crime Category Pie Chart */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Offense Category Breakdown</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.crime_type_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="category"
                >
                  {data?.crime_type_distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0b132b", borderColor: "#1c2541", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Station Performance Table */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Police Station Performance & Resolution Benchmarks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0e1735] border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                <th className="py-2.5 px-4">Police Station</th>
                <th className="py-2.5 px-4">Total Cases</th>
                <th className="py-2.5 px-4">Closed Cases</th>
                <th className="py-2.5 px-4">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.station_performance?.map((st) => (
                <tr key={st.station_name} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-4 font-bold text-slate-200">{st.station_name}</td>
                  <td className="py-2.5 px-4 text-slate-300 font-mono">{st.total_cases}</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-mono">{st.closed_cases}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-cyan-400">{st.resolution_rate}%</span>
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
