"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  Users, 
  FileText, 
  CheckCircle2, 
  TrendingUp,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { api } from "@/services/api";

const mockMonthlyData = [
  { month: "Jan", crimes: 42, resolved: 35 },
  { month: "Feb", crimes: 58, resolved: 48 },
  { month: "Mar", crimes: 65, resolved: 52 },
  { month: "Apr", crimes: 48, resolved: 41 },
  { month: "May", crimes: 72, resolved: 60 },
  { month: "Jun", crimes: 80, resolved: 68 },
  { month: "Jul", crimes: 61, resolved: 54 },
];

const COLORS = ["#00b4d8", "#ff003c", "#f77f00", "#48cae4", "#7209b7"];

export default function DashboardPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/analytics/dashboard-stats");
      return res.data?.data;
    },
  });

  const cards = [
    { label: "Total Crimes", val: statsData?.summary_cards?.total_crimes ?? 124, icon: ShieldAlert, color: "text-cyan-400", border: "border-cyan-500/20" },
    { label: "Open Cases", val: statsData?.summary_cards?.open_cases ?? 42, icon: Clock, color: "text-amber-400", border: "border-amber-500/20" },
    { label: "Under Investigation", val: statsData?.summary_cards?.under_investigation ?? 31, icon: Activity, color: "text-blue-400", border: "border-blue-500/20" },
    { label: "Closed Cases", val: statsData?.summary_cards?.closed_cases ?? 51, icon: CheckCircle2, color: "text-emerald-400", border: "border-emerald-500/20" },
    { label: "Critical Cases", val: statsData?.summary_cards?.critical_cases ?? 8, icon: AlertTriangle, color: "text-rose-400", border: "border-rose-500/20" },
    { label: "Registered FIRs", val: statsData?.summary_cards?.total_firs ?? 98, icon: FileText, color: "text-purple-400", border: "border-purple-500/20" },
    { label: "Active Officers", val: statsData?.summary_cards?.total_officers ?? 24, icon: Users, color: "text-sky-400", border: "border-sky-500/20" },
    { label: "Clearance Rate", val: "76.4%", icon: TrendingUp, color: "text-emerald-400", border: "border-emerald-500/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>Police Department Executive Dashboard</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono">Live</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Real-time crime statistics, officer response metrics, and crime trend forecasts.</p>
      </div>

      {/* Summary Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className={`bg-[#0b132b] border ${c.border} rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/20`}
            >
              <div>
                <p className="text-xs text-slate-400 font-medium">{c.label}</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{c.val}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-900/60 border border-slate-800 ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crime Trends Area Chart */}
        <div className="lg:col-span-2 bg-[#0b132b] border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Monthly Crime Registration vs Resolution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyData}>
                <defs>
                  <linearGradient id="colorCrimes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2541" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0b132b", borderColor: "#1c2541", fontSize: "12px" }} />
                <Area type="monotone" dataKey="crimes" stroke="#00b4d8" fillOpacity={1} fill="url(#colorCrimes)" name="Crimes Registered" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" name="Cases Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crime Types Distribution Bar Chart */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Crime Classification Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData?.crime_types || [
                { type: "Robbery", count: 18 },
                { type: "Cybercrime", count: 24 },
                { type: "Assault", count: 12 },
                { type: "Theft", count: 30 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2541" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0b132b", borderColor: "#1c2541", fontSize: "12px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(statsData?.crime_types || [1, 2, 3, 4]).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
