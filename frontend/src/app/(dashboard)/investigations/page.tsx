"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Plus, Search, Eye, BookOpen, Clock, UserCheck, CheckCircle2, AlertCircle, X, Edit2, Trash2, RotateCcw } from "lucide-react";
import { investigationService } from "@/services/investigationService";
import { crimeService } from "@/services/crimeService";
import { Investigation, Crime } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function InvestigationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [invToEdit, setInvToEdit] = useState<Investigation | null>(null);
  const [invToDelete, setInvToDelete] = useState<Investigation | null>(null);
  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);
  const [caseDiaryNotes, setCaseDiaryNotes] = useState("");

  // Init / Edit Form
  const [crimeId, setCrimeId] = useState<number | "">("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("In Progress");

  // Queries
  const { data: invData, isLoading } = useQuery({
    queryKey: ["investigations", statusFilter, showDeleted],
    queryFn: () => investigationService.getInvestigations({ status: statusFilter, is_deleted: showDeleted }),
  });

  const { data: crimesData } = useQuery({
    queryKey: ["crimes-select"],
    queryFn: () => crimeService.getCrimes({ page_size: 100 }),
  });

  // Init Investigation Mutation
  const initMutation = useMutation({
    mutationFn: () => investigationService.createInvestigation({
      crime_id: Number(crimeId),
      summary,
      status: "In Progress"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
      setIsInitModalOpen(false);
      resetForm();
      showToast("Investigation file opened.", "success");
    }
  });

  // Update Investigation Mutation
  const updateMutation = useMutation({
    mutationFn: () => investigationService.updateInvestigation(invToEdit!.public_id, {
      summary,
      status: status as any
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
      setInvToEdit(null);
      resetForm();
      showToast("Investigation details updated.", "success");
    }
  });

  // Add Case Diary Entry Mutation
  const diaryMutation = useMutation({
    mutationFn: () => investigationService.addCaseDiaryEntry(selectedInv!.public_id, caseDiaryNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
      showToast("Case Diary entry logged.", "success");
      setCaseDiaryNotes("");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => investigationService.deleteInvestigation(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
      setInvToDelete(null);
      showToast("Investigation record deleted.", "info");
    }
  });

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: (publicId: string) => investigationService.restoreInvestigation(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
      showToast("Investigation record restored.", "success");
    }
  });

  const resetForm = () => {
    setCrimeId("");
    setSummary("");
    setStatus("In Progress");
  };

  const openEditModal = (inv: Investigation) => {
    setInvToEdit(inv);
    setSummary(inv.summary || "");
    setStatus(inv.status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <span>Detective Investigation & Case Diary Module</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Lead officer assignments, daily case diary notes, chargesheets and investigation timelines.</p>
        </div>
        <button
          onClick={() => {
            setInvToEdit(null);
            resetForm();
            setIsInitModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Open Investigation Case</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1c2541]/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="">All Investigation Statuses</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending Chargesheet">Pending Chargesheet</option>
          <option value="Closed">Closed</option>
          <option value="Cold Case">Cold Case</option>
        </select>

        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
            showDeleted ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-[#1c2541]/50 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
        >
          {showDeleted ? "Viewing Deleted Investigations" : "View Active Investigations"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0e1735] border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Case Ref</th>
                  <th className="py-3 px-4">Lead Investigator</th>
                  <th className="py-3 px-4">Case Summary</th>
                  <th className="py-3 px-4">Started Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invData?.data?.items?.map((inv: Investigation) => (
                  <tr key={inv.public_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-bold">CASE-INV-#{inv.id}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">{inv.lead_investigator?.full_name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{inv.summary || "No summary provided."}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{new Date(inv.started_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInv(inv)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-[11px] inline-flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Case Diary ({inv.case_diaries?.length || 0})</span>
                        </button>
                        <button
                          onClick={() => openEditModal(inv)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
                          title="Edit Investigation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {showDeleted ? (
                          <button
                            onClick={() => restoreMutation.mutate(inv.public_id)}
                            className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            title="Restore Case"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setInvToDelete(inv)}
                            className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                            title="Delete Case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Init / Edit Investigation Modal */}
      {(isInitModalOpen || invToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => {
                setIsInitModalOpen(false);
                setInvToEdit(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">
              {invToEdit ? `Edit Investigation - CASE-INV-#${invToEdit.id}` : "Open Investigation Case"}
            </h2>

            <div className="space-y-3 text-xs">
              {!invToEdit && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Crime Incident</label>
                  <select
                    value={crimeId}
                    onChange={(e) => setCrimeId(Number(e.target.value))}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="">Select Crime...</option>
                    {crimesData?.data?.items?.map((c: Crime) => (
                      <option key={c.public_id} value={c.id}>
                        {c.crime_number} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {invToEdit && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Investigation Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Chargesheet">Pending Chargesheet</option>
                    <option value="Closed">Closed</option>
                    <option value="Cold Case">Cold Case</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Investigation Scope Summary</label>
                <textarea
                  rows={3}
                  placeholder="Scope of investigation..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsInitModalOpen(false);
                    setInvToEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={invToEdit ? updateMutation.isPending : (!crimeId || initMutation.isPending)}
                  onClick={() => invToEdit ? updateMutation.mutate() : initMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  {invToEdit ? (updateMutation.isPending ? "Saving..." : "Save Changes") : (initMutation.isPending ? "Initializing..." : "Initialize File")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Diary Drawer Modal */}
      {selectedInv && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setSelectedInv(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Official Case Diary - CASE-INV-#{selectedInv.id}</span>
            </h2>

            {/* Add Entry Box */}
            <div className="space-y-2 text-xs bg-[#1c2541]/40 p-3 rounded-lg border border-slate-800">
              <label className="block text-slate-300 font-medium">Log Daily Investigation Entry</label>
              <textarea
                rows={3}
                placeholder="Notes on witness interviews, forensic reports, crime scene visits..."
                value={caseDiaryNotes}
                onChange={(e) => setCaseDiaryNotes(e.target.value)}
                className="w-full bg-[#0b132b] border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
              <button
                disabled={!caseDiaryNotes || diaryMutation.isPending}
                onClick={() => diaryMutation.mutate()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs"
              >
                Log Entry
              </button>
            </div>

            {/* Existing Logs */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diary Entries History</p>
              {selectedInv.case_diaries?.map((diary) => (
                <div key={diary.public_id} className="p-3 bg-[#1c2541]/20 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-cyan-400 font-mono">
                    <span>Logged by: {diary.author?.full_name || "Investigator"}</span>
                    <span>{new Date(diary.entry_date).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{diary.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!invToDelete}
        title="Delete Investigation Record"
        message={`Are you sure you want to delete investigation CASE-INV-#${invToDelete?.id}?`}
        onConfirm={() => invToDelete && deleteMutation.mutate(invToDelete.public_id)}
        onCancel={() => setInvToDelete(null)}
      />
    </div>
  );
}
