"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCheck2, Briefcase, Clock, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Calendar, Award } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { crimeService } from "@/services/crimeService";
import { firService } from "@/services/firService";
import { Crime, FIR } from "@/types";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function OfficerWorkspacePage() {
  const { user } = useAuth();

  const { data: crimesData, isLoading: isLoadingCrimes } = useQuery({
    queryKey: ["officer-crimes"],
    queryFn: () => crimeService.getCrimes({ page_size: 50 }),
  });

  const { data: firsData, isLoading: isLoadingFIRs } = useQuery({
    queryKey: ["officer-firs"],
    queryFn: () => firService.getFIRs({ page_size: 50 }),
  });

  const crimesList = crimesData?.data?.items || [];
  const firsList = firsData?.data?.items || [];

  const assignedCases = crimesList.filter((c: Crime) => c.status !== "Closed");
  const completedCases = crimesList.filter((c: Crime) => c.status === "Closed");
  const pendingCases = crimesList.filter((c: Crime) => c.status === "Open" || c.status === "Under Investigation");

  if (isLoadingCrimes || isLoadingFIRs) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Officer Header Banner */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 text-2xl shadow-lg">
            {user?.full_name?.charAt(0) || "O"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>{user?.full_name || "Officer Workspace"}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                {user?.badge_number || "IND-POL-001"}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {user?.rank || "Director General of Police"} • {user?.station_name || "Police Headquarters"}
            </p>
          </div>
        </div>

        <div className="flex gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 text-xs">
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">PERFORMANCE SCORE</p>
            <p className="text-xl font-bold text-cyan-400 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>96.5%</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">DUTY STATUS</p>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block mt-1">
              Active On Duty
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Assigned Cases</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{assignedCases.length}</p>
          <p className="text-[10px] text-slate-500 font-mono">Active Investigation Duties</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Pending Chargesheets</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{pendingCases.length}</p>
          <p className="text-[10px] text-amber-500/80 font-mono">Awaiting Final Court Submission</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Solved / Closed Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{completedCases.length}</p>
          <p className="text-[10px] text-emerald-500/80 font-mono">Successfully Closed</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Recent FIR Filings</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{firsList.length}</p>
          <p className="text-[10px] text-slate-500 font-mono">Under CrPC Section 154</p>
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Active Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Assigned Cases List */}
        <div className="lg:col-span-2 bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Assigned Active Incident Files</span>
            </span>
            <span className="text-xs text-cyan-400 font-mono font-normal">Count: {assignedCases.length}</span>
          </h2>

          <div className="space-y-3">
            {assignedCases.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No active assigned cases.</p>
            ) : (
              assignedCases.map((c: Crime) => (
                <div key={c.public_id} className="p-3.5 bg-[#1c2541]/40 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{c.crime_number}</span>
                      <h3 className="font-bold text-slate-100 text-sm mt-0.5">{c.title}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.severity === "Critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}>
                      {c.severity}
                    </span>
                  </div>

                  <p className="text-slate-400 line-clamp-2 text-[11px]">{c.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Location: {c.location_name}</span>
                    <a href={`/crimes/${c.public_id}`} className="text-cyan-400 hover:underline font-medium">Open File →</a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Agenda & Deadlines */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Today's Work & Deadlines</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-cyan-400 font-mono text-[10px]">
                <span>COURT HEARING</span>
                <span>10:30 AM</span>
              </div>
              <p className="font-bold text-slate-200">Present Evidence for CR-2026-1001</p>
              <p className="text-[10px] text-slate-400">High Court Room 4B</p>
            </div>

            <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-amber-400 font-mono text-[10px]">
                <span>CHARGESHEET DUE</span>
                <span>05:00 PM</span>
              </div>
              <p className="font-bold text-slate-200">File Chargesheet for Cyber Fraud</p>
              <p className="text-[10px] text-slate-400">Magistrate Bench Sector 2</p>
            </div>

            <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-emerald-400 font-mono text-[10px]">
                <span>WITNESS STATEMENT</span>
                <span>06:30 PM</span>
              </div>
              <p className="font-bold text-slate-200">Record Witness 02 Statement</p>
              <p className="text-[10px] text-slate-400">Central Police Station</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
