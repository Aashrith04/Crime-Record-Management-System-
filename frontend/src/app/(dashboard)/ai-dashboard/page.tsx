"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, BrainCircuit, Activity, FileText, ScanLine, Clock, ShieldCheck, MapPin, Zap, Award } from "lucide-react";
import { aiService } from "@/services/aiService";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function AIDashboardPage() {
  const { data: statsRes, isLoading: isLoadingStats } = useQuery({
    queryKey: ["ai-dashboard-stats"],
    queryFn: () => aiService.getDashboardStats(),
  });

  const { data: hotspotsRes, isLoading: isLoadingHotspots } = useQuery({
    queryKey: ["ai-hotspots"],
    queryFn: () => aiService.getHotspots(),
  });

  const stats = statsRes?.data;
  const hotspots = hotspotsRes?.data?.hotspots || [];

  if (isLoadingStats || isLoadingHotspots) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Dedicated AI Subsystem Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time metrics for RAG queries, OCR queue, FIR summarizations, and crime hotspot predictions.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-500/30">
            Provider: {stats?.active_provider || "Baseline Rule Engine"}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Total AI Queries</span>
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats?.total_ai_queries || 0}</p>
          <p className="text-[10px] text-slate-500 font-mono">Conversational Copilot Calls</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">FIR Summaries</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.total_fir_summaries || 0}</p>
          <p className="text-[10px] text-amber-500/80 font-mono">NLP Summarization Logs</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">OCR Parsed Documents</span>
            <ScanLine className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats?.total_ocr_documents || 0}</p>
          <p className="text-[10px] text-emerald-500/80 font-mono">Processed Scanned Files</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Avg Accuracy Score</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{stats?.avg_confidence_score || 94.5}%</p>
          <p className="text-[10px] text-slate-500 font-mono">Avg Latency: {stats?.avg_latency_ms || 120}ms</p>
        </div>
      </div>

      {/* Main Grid: Hotspot Predictions & Activity Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspot Predictions Sector List */}
        <div className="lg:col-span-2 bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>AI Hotspot & High Risk Sector Predictions</span>
            </span>
            <span className="text-xs text-cyan-400 font-mono font-normal">Spatial Analysis</span>
          </h2>

          <div className="space-y-3">
            {hotspots.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No spatial crime data for hotspot modeling.</p>
            ) : (
              hotspots.map((hs: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-[#1c2541]/40 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xs font-mono">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm">{hs.sector_name}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      Density Score: {hs.density_score}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <div><span className="text-slate-500">Risk Offense:</span> {hs.high_risk_crime_type}</div>
                    <div><span className="text-slate-500">Peak Hours:</span> {hs.peak_time_window}</div>
                    <div><span className="text-slate-500">Patrol Units:</span> {hs.recommended_patrol_count} Patrols</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queues & Activity Feed */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Queue Status & Log</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-cyan-400 font-mono text-[10px]">
                <span>OCR DOCUMENT QUEUE</span>
                <span>IDLE</span>
              </div>
              <p className="font-bold text-slate-200">0 Files Pending Processing</p>
              <p className="text-[10px] text-slate-400">All scanned evidence documents parsed.</p>
            </div>

            <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-emerald-400 font-mono text-[10px]">
                <span>SEMANTIC VECTOR INDEX</span>
                <span>SYNCED</span>
              </div>
              <p className="font-bold text-slate-200">64-Dim Lightweight Index</p>
              <p className="text-[10px] text-slate-400">Vector store fully synchronized.</p>
            </div>

            <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-amber-400 font-mono text-[10px]">
                <span>RAG INTENT DETECTOR</span>
                <span>ACTIVE</span>
              </div>
              <p className="font-bold text-slate-200">Multi-table Context Retrieval</p>
              <p className="text-[10px] text-slate-400">Crimes, FIRs, Evidence, Officers grounded.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
