"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Network, ShieldAlert, ArrowRight, CheckCircle2, XCircle, Tag, Sparkles, AlertTriangle } from "lucide-react";
import { intelligenceService, CrossCaseLinkRead } from "@/services/intelligenceService";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function CrossCaseIntelligencePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: linksRes, isLoading } = useQuery({
    queryKey: ["cross-case-links"],
    queryFn: () => intelligenceService.getCrossCaseLinks(),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ linkId, feedback }: { linkId: number; feedback: "Confirmed" | "False Positive" }) =>
      intelligenceService.submitCrossCaseFeedback(linkId, feedback),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["cross-case-links"] });
      showToast(`Investigator feedback recorded: ${res.data.feedback}.`, "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Failed to record feedback.", "error");
    }
  });

  const links = linksRes?.data || [];

  if (isLoading) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Cross-Case Intelligence Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Discovering hidden investigative links across crime incidents, shared MO, suspect aliases, weapons, and evidence.</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            Active Intelligence Links: {links.length}
          </span>
        </div>
      </div>

      {/* Cross-Case Links Feed */}
      <div className="space-y-4">
        {links.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#0b132b] border border-slate-800 rounded-xl">
            No cross-case intelligence links detected.
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-cyan-400 font-bold">Link #{link.id}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    link.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                    link.status === "False Positive" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}>
                    {link.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{link.match_score}% Match Score</span>
                  <span className="text-amber-400">{link.risk_score}% Risk Level</span>
                </div>
              </div>

              {/* Linked Crimes Comparison Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1c2541]/40 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Crime Incident A</span>
                  <h3 className="font-bold text-slate-100 text-sm">{link.crime_a_title}</h3>
                  <p className="text-slate-400 font-mono text-[11px]">Public ID: {link.crime_a_public_id}</p>
                </div>

                <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Crime Incident B</span>
                  <h3 className="font-bold text-slate-100 text-sm">{link.crime_b_title}</h3>
                  <p className="text-slate-400 font-mono text-[11px]">Public ID: {link.crime_b_public_id}</p>
                </div>
              </div>

              {/* AI Reasoning & Shared Entities */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-300"><span className="text-cyan-400 font-bold">AI Correlation Finding:</span> {link.matching_reason}</p>

                {link.matching_entities && link.matching_entities.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-slate-400 text-[11px] font-bold">Shared Factors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {link.matching_entities.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-black/50 border border-slate-700 text-cyan-400 text-[10px] font-mono flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Investigator Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 font-mono">Discovered: {new Date(link.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={feedbackMutation.isPending}
                    onClick={() => feedbackMutation.mutate({ linkId: link.id, feedback: "False Positive" })}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 font-medium text-xs flex items-center gap-1 border border-rose-500/20"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Mark False Positive</span>
                  </button>
                  <button
                    disabled={feedbackMutation.isPending}
                    onClick={() => feedbackMutation.mutate({ linkId: link.id, feedback: "Confirmed" })}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Link</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
