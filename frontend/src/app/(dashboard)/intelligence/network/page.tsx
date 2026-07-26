"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network, Users, ShieldAlert, FolderArchive, BadgeAlert, ArrowRight, Eye, Search, Filter, Sparkles, Activity } from "lucide-react";
import { intelligenceService, GraphNode, GraphEdge } from "@/services/intelligenceService";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function CriminalNetworkPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: graphRes, isLoading } = useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: () => intelligenceService.getKnowledgeGraph(),
  });

  const graph = graphRes?.data;
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  const filteredNodes = filterType === "all" ? nodes : nodes.filter(n => n.type.toLowerCase() === filterType);

  if (isLoading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Criminal Intelligence Network & Knowledge Graph</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Multi-entity relational graph connecting suspects, crimes, evidence items, and investigating officers.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-500/30">
            Total Nodes: {graph?.total_nodes || 0} | Edges: {graph?.total_edges || 0}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="font-medium">Filter Node Types:</span>
          <div className="flex flex-wrap gap-2">
            {["all", "criminal", "crime", "evidence", "officer"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg capitalize border font-medium transition ${
                  filterType === t
                    ? "bg-cyan-600 text-white border-cyan-400"
                    : "bg-[#1c2541]/40 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graph Visualizer Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node & Link Explorer */}
        <div className="lg:col-span-2 bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Interconnected Graph Node Registry</span>
            </span>
            <span className="text-xs text-cyan-400 font-mono">Weighted Knowledge Matrix</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {filteredNodes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n)}
                className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                  selectedNode?.id === n.id
                    ? "bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/10"
                    : "bg-[#1c2541]/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                    n.type === "Criminal" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                    n.type === "Crime" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                    n.type === "Evidence" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                    "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  }`}>
                    {n.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{n.id.slice(0, 8)}...</span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm truncate">{n.label}</h3>

                {/* Edges from this node */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  {edges.filter(e => e.source === n.id || e.target === n.id).map((e, idx) => (
                    <div key={idx} className="flex justify-between items-center font-mono text-[10px]">
                      <span className="text-cyan-400 font-bold">{e.relationship}</span>
                      <span className="text-slate-500">{e.confidence}% Conf</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Entity Information Panel */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Entity Intelligence Panel</span>
          </h2>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#1c2541]/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold">{selectedNode.type} NODE</span>
                <p className="font-bold text-slate-100 text-sm">{selectedNode.label}</p>
                <p className="text-slate-400 font-mono text-[10px]">Public ID: {selectedNode.id}</p>
              </div>

              <div className="p-3 bg-[#1c2541]/40 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300">Associated Graph Edges</h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((e, idx) => (
                    <div key={idx} className="p-2 bg-[#0b132b] rounded border border-slate-800 space-y-0.5">
                      <p className="text-cyan-400 font-bold">{e.relationship}</p>
                      <p className="text-slate-400 text-[10px]">Target: {e.target}</p>
                      <p className="text-slate-500 text-[10px]">Weighted Confidence: {e.confidence}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">Click any node in the graph registry to inspect entity intelligence details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
