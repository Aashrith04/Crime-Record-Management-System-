"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Network, Users, GitMerge, AlertTriangle, ShieldCheck, CheckCircle, Search, ArrowRight, Eye, RefreshCw, X, Bell, UserCheck2, Sparkles, CheckCircle2 } from "lucide-react";
import { intelligenceService, DuplicateMatch, EntityResolutionRead, IntelligenceAlertRead, OfficerMetricRead } from "@/services/intelligenceService";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function IntelligencePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [mergeModalDuplicate, setMergeModalDuplicate] = useState<DuplicateMatch | null>(null);
  const [mergeReason, setMergeReason] = useState("Confirms identical suspect identity based on phone, alias and crime history.");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Overview Data
  const { data: overviewRes, isLoading } = useQuery({
    queryKey: ["intelligence-overview"],
    queryFn: () => intelligenceService.getOverview(),
  });

  // Fetch Resolved Entities
  const { data: entitiesRes } = useQuery({
    queryKey: ["resolved-entities"],
    queryFn: () => intelligenceService.getEntities(),
  });

  // Fetch Predictive Alerts
  const { data: alertsRes } = useQuery({
    queryKey: ["intelligence-alerts"],
    queryFn: () => intelligenceService.getAlerts(),
  });

  // Fetch Officer Metrics
  const { data: officersRes } = useQuery({
    queryKey: ["officer-intelligence"],
    queryFn: () => intelligenceService.getOfficerMetrics(),
  });

  // Merge Mutation
  const mergeMutation = useMutation({
    mutationFn: () => intelligenceService.mergeEntities(
      mergeModalDuplicate!.record_a.public_id,
      mergeModalDuplicate!.record_b.public_id,
      mergeReason
    ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["intelligence-overview"] });
      queryClient.invalidateQueries({ queryKey: ["resolved-entities"] });
      setMergeModalDuplicate(null);
      showToast(`Identity records merged cleanly into canonical profile '${res.data.canonical_name}'.`, "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Merge operation failed.", "error");
    }
  });

  // Acknowledge Alert Mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: number) => intelligenceService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence-alerts"] });
      showToast("Predictive alert status updated to Acknowledged.", "info");
    }
  });

  const overview = overviewRes?.data;
  const duplicates = overview?.duplicates || [];
  const resolvedEntities = entitiesRes?.data || [];
  const alerts = alertsRes?.data || [];
  const officerMetrics = officersRes?.data || [];

  if (isLoading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Enterprise Investigation Intelligence Platform (Phase 4C)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Unified Intelligence Platform combining Entity Resolution, Knowledge Graphs, Predictive Alerts, and Officer Workload Analytics.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-500/30">
            Engine: Intelligence Platform v4C Final
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Entities Resolved</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{overview?.total_entities_resolved || 0}</p>
          <p className="text-[10px] text-slate-500 font-mono">Canonical Suspect Profiles</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Potential Duplicates</span>
            <GitMerge className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{overview?.potential_duplicates_count || 0}</p>
          <p className="text-[10px] text-amber-500/80 font-mono">Requires Officer Merge Action</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Cross-Case Links</span>
            <Network className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{overview?.cross_case_links_count || 3}</p>
          <p className="text-[10px] text-emerald-500/80 font-mono">Linked Crime Incidents</p>
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium">Predictive Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400">{alerts.length}</p>
          <p className="text-[10px] text-rose-500/80 font-mono">Active Intelligence Alerts</p>
        </div>
      </div>

      {/* Module 8: Predictive Alerts Center & Officer Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictive Alerts Feed */}
        <div className="lg:col-span-2 bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" />
              <span>Module 8: Predictive Investigation Alerts Center</span>
            </h2>
            <span className="text-xs text-rose-400 font-mono">Real-Time Risk Alerts</span>
          </div>

          <div className="space-y-3 text-xs">
            {alerts.map((al) => (
              <div key={al.id} className="p-3.5 bg-[#1c2541]/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    al.priority === "Critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}>
                    {al.priority} Priority: {al.alert_type}
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">{al.confidence}% Confidence</span>
                </div>

                <p className="text-slate-200 font-medium">{al.description}</p>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-500 font-mono">Status: {al.status}</span>
                  {al.status !== "Acknowledged" && (
                    <button
                      onClick={() => acknowledgeAlertMutation.mutate(al.id)}
                      className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/30 font-medium text-[11px] inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Acknowledge Alert</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module 6: Officer Intelligence Metrics */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Module 6: Officer Workload Intelligence</span>
          </h2>

          <div className="space-y-3 text-xs">
            {officerMetrics.slice(0, 3).map((m) => (
              <div key={m.officer_public_id} className="p-3 bg-[#1c2541]/50 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center font-bold text-slate-200">
                  <span>{m.officer_name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{m.efficiency}% Efficiency</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Workload: {m.workload} Cases</span>
                  <span>Closure: {m.closure_rate}%</span>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-1">{m.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Duplicates & Resolved Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Potential Duplicates Section */}
        <div className="lg:col-span-2 bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-amber-400" />
              <span>Entity Resolution Engine — Candidate Duplicate Matches</span>
            </h2>
            <span className="text-xs text-amber-400 font-mono">AI Similarity Ranking</span>
          </div>

          {duplicates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-slate-200">No unmerged duplicate suspect profiles detected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((dup) => (
                <div key={dup.public_id} className="p-4 bg-[#1c2541]/40 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-cyan-400 font-bold">{dup.public_id}</span>
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[11px]">
                      {dup.confidence_score}% Match Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-[#0b132b] p-3 rounded-lg border border-slate-800">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Record A</span>
                      <p className="font-bold text-slate-200">{dup.record_a.full_name}</p>
                      <p className="text-slate-400 text-[11px]">Alias: {dup.record_a.alias || "N/A"}</p>
                      <p className="text-slate-400 font-mono text-[11px]">Phone: {dup.record_a.phone || "N/A"}</p>
                    </div>

                    <div className="space-y-1 border-l border-slate-800 pl-3">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Record B</span>
                      <p className="font-bold text-slate-200">{dup.record_b.full_name}</p>
                      <p className="text-slate-400 text-[11px]">Alias: {dup.record_b.alias || "N/A"}</p>
                      <p className="text-slate-400 font-mono text-[11px]">Phone: {dup.record_b.phone || "N/A"}</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px]"><span className="text-cyan-400 font-bold">AI Explanation:</span> {dup.reasoning}</p>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setMergeModalDuplicate(dup)}
                      className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Review & Merge Identity</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Identities Directory */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Resolved Canonical Directory</span>
          </h2>

          <div className="space-y-3 text-xs">
            {resolvedEntities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No merged canonical profiles in directory.</p>
            ) : (
              resolvedEntities.map((ent) => (
                <div key={ent.public_id} className="p-3 bg-[#1c2541]/50 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center font-bold text-slate-200">
                    <span>{ent.canonical_name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">{ent.confidence}% Score</span>
                  </div>
                  <p className="text-[11px] text-slate-400"><span className="text-slate-500">Merged Records:</span> {ent.source_records?.length || 2} Profiles</p>
                  <p className="text-[10px] text-slate-500 font-mono">Resolved: {new Date(ent.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Merge Confirmation & Reason Modal */}
      {mergeModalDuplicate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setMergeModalDuplicate(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-cyan-400" />
              <span>Merge Duplicate Identity Records</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#1c2541]/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>{mergeModalDuplicate.record_a.full_name}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <span>{mergeModalDuplicate.record_b.full_name}</span>
                </div>
                <p className="text-[11px] text-amber-400 font-mono">Merge Confidence: {mergeModalDuplicate.confidence_score}%</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Merge Justification & Audit Log Reason</label>
                <textarea
                  rows={3}
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setMergeModalDuplicate(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button
                  disabled={mergeMutation.isPending || !mergeReason.trim()}
                  onClick={() => mergeMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  Confirm & Execute Merge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
