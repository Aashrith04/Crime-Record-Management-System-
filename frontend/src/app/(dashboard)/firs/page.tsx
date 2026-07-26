"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Printer, Download, Eye, Plus, ShieldCheck, Search, Trash2, X, Inbox, Edit2, RotateCcw, BrainCircuit, Sparkles, Loader2 } from "lucide-react";
import { firService } from "@/services/firService";
import { crimeService } from "@/services/crimeService";
import { aiService, FIRSummaryResponseData } from "@/services/aiService";
import { FIR, Crime } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExportButtons } from "@/components/ui/ExportButtons";

export default function FIRPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedFIR, setSelectedFIR] = useState<FIR | null>(null);
  const [aiSummaryFIR, setAiSummaryFIR] = useState<FIRSummaryResponseData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [firToEdit, setFirToEdit] = useState<FIR | null>(null);
  const [firToDelete, setFirToDelete] = useState<FIR | null>(null);

  // Form State
  const [crimeId, setCrimeId] = useState<number | "">("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantContact, setComplainantContact] = useState("");
  const [complainantAddress, setComplainantAddress] = useState("");
  const [incidentDetails, setIncidentDetails] = useState("");
  const [sectionsOfLaw, setSectionsOfLaw] = useState("IPC Section 379, 420");
  const [status, setStatus] = useState("Registered");

  // Fetch FIRs
  const { data: firsData, isLoading } = useQuery({
    queryKey: ["firs", search, showDeleted, page],
    queryFn: () => firService.getFIRs({ search, is_deleted: showDeleted, page, page_size: 10 }),
  });

  // Fetch Crimes for Linking
  const { data: crimesData } = useQuery({
    queryKey: ["crimes-list-select"],
    queryFn: () => crimeService.getCrimes({ page_size: 100 }),
  });

  const crimesList = crimesData?.data?.items || [];

  // Register FIR Mutation
  const createMutation = useMutation({
    mutationFn: () => firService.createFIR({
      crime_id: Number(crimeId),
      complainant_name: complainantName,
      complainant_contact: complainantContact,
      complainant_address: complainantAddress,
      incident_details: incidentDetails,
      sections_of_law: sectionsOfLaw,
      status: status as any
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      setIsCreateModalOpen(false);
      resetForm();
      showToast("FIR registered successfully under CrPC 154.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Failed to register FIR.", "error");
    }
  });

  // Update FIR Mutation
  const updateMutation = useMutation({
    mutationFn: () => firService.updateFIR(firToEdit!.public_id, {
      complainant_name: complainantName,
      complainant_contact: complainantContact,
      complainant_address: complainantAddress,
      incident_details: incidentDetails,
      sections_of_law: sectionsOfLaw,
      status: status as any
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      setFirToEdit(null);
      resetForm();
      showToast("FIR record updated successfully.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Failed to update FIR.", "error");
    }
  });

  // AI FIR Summarization Mutation
  const aiSummarizeMutation = useMutation({
    mutationFn: (firNum: string) => aiService.summarizeFIR(firNum),
    onSuccess: (res) => {
      setAiSummaryFIR(res.data);
      showToast("FIR summarized using AI NLP analyzer.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "AI Summarization failed.", "error");
    }
  });

  // Delete FIR Mutation
  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => firService.deleteFIR(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      showToast("FIR record deleted.", "info");
      setFirToDelete(null);
    }
  });

  // Restore FIR Mutation
  const restoreMutation = useMutation({
    mutationFn: (publicId: string) => firService.restoreFIR(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      showToast("FIR record restored.", "success");
    }
  });

  const resetForm = () => {
    setCrimeId("");
    setComplainantName("");
    setComplainantContact("");
    setComplainantAddress("");
    setIncidentDetails("");
    setSectionsOfLaw("IPC Section 379, 420");
    setStatus("Registered");
  };

  const openEditModal = (fir: FIR) => {
    setFirToEdit(fir);
    setComplainantName(fir.complainant_name);
    setComplainantContact(fir.complainant_contact);
    setComplainantAddress(fir.complainant_address || "");
    setIncidentDetails(fir.incident_details);
    setSectionsOfLaw(fir.sections_of_law);
    setStatus(fir.status);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>First Information Report (FIR) Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Official state registry of FIRs registered under Code of Criminal Procedure (CrPC Section 154).</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <ExportButtons entity="firs" />
          <button
            onClick={() => {
              setFirToEdit(null);
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New FIR</span>
          </button>
        </div>
      </div>

      {/* Search & Toggle Bar */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search FIR number, complainant, IPC sections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c2541]/50 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
            showDeleted ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-[#1c2541]/50 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
        >
          {showDeleted ? "Viewing Deleted FIRs" : "View Active FIRs"}
        </button>
      </div>

      {/* FIR Records Table */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : firsData?.data?.items?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Inbox className="w-10 h-10 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">No FIR records registered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0e1735] border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">FIR Number</th>
                  <th className="py-3 px-4">Complainant</th>
                  <th className="py-3 px-4">Sections of Law</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {firsData?.data?.items?.map((fir: FIR) => (
                  <tr key={fir.public_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{fir.fir_number}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">{fir.complainant_name}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{fir.sections_of_law}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(fir.registered_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        {fir.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => aiSummarizeMutation.mutate(fir.fir_number)}
                          disabled={aiSummarizeMutation.isPending}
                          className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/30 font-medium text-[11px] inline-flex items-center gap-1"
                          title="AI Summarize FIR"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                          <span>AI Summary</span>
                        </button>
                        <button
                          onClick={() => firService.downloadPDF(fir.public_id, fir.fir_number)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedFIR(fir)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEditModal(fir)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {showDeleted ? (
                          <button
                            onClick={() => restoreMutation.mutate(fir.public_id)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setFirToDelete(fir)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400"
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

      {/* AI Summary Modal */}
      {aiSummaryFIR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-cyan-500/40 rounded-2xl w-full max-w-xl p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setAiSummaryFIR(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-cyan-400" />
                  <span>AI Summary — {aiSummaryFIR.fir_number}</span>
                </h2>
                <p className="text-xs text-slate-400">Generated via Law Enforcement NLP Engine</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                {aiSummaryFIR.confidence.confidence_percentage}% {aiSummaryFIR.confidence.confidence_category} Confidence
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#1c2541]/60 rounded-xl border border-slate-800 space-y-1">
                <h3 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">Executive Summary</h3>
                <p className="text-slate-200 leading-relaxed">{aiSummaryFIR.short_summary}</p>
              </div>

              <div className="p-3 bg-[#1c2541]/60 rounded-xl border border-slate-800 space-y-1">
                <h3 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">Detailed Investigation Narrative</h3>
                <p className="text-slate-300 leading-relaxed">{aiSummaryFIR.detailed_summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#1c2541]/40 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-300 text-[11px]">Extracted IPC Sections</h4>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {aiSummaryFIR.extracted_ipc_sections.map((sec, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono text-[10px]">{sec}</span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#1c2541]/40 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-300 text-[11px]">Key Individuals & Locations</h4>
                  <p className="text-slate-400 text-[11px]">Persons: {aiSummaryFIR.key_individuals.join(", ")}</p>
                  <p className="text-slate-400 text-[11px]">Location: {aiSummaryFIR.locations.join(", ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View FIR Details Modal */}
      {selectedFIR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setSelectedFIR(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>{selectedFIR.fir_number}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#1c2541]/50 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400">Complainant:</span>
                  <p className="font-semibold text-slate-200">{selectedFIR.complainant_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Contact:</span>
                  <p className="font-semibold text-slate-200">{selectedFIR.complainant_contact}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Sections of Law:</span>
                <p className="font-mono text-cyan-400 mt-0.5">{selectedFIR.sections_of_law}</p>
              </div>

              <div>
                <span className="text-slate-400">Incident Details:</span>
                <p className="text-slate-300 mt-1 whitespace-pre-wrap bg-[#1c2541]/30 p-3 rounded-lg border border-slate-800">{selectedFIR.incident_details}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register / Edit FIR Modal */}
      {(isCreateModalOpen || firToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button onClick={() => { setIsCreateModalOpen(false); setFirToEdit(null); }} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">
              {firToEdit ? `Edit FIR - ${firToEdit.fir_number}` : "Register New FIR"}
            </h2>

            <div className="space-y-3 text-xs">
              {!firToEdit && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Crime Incident</label>
                  <select
                    value={crimeId}
                    onChange={(e) => setCrimeId(Number(e.target.value))}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="">Select Crime...</option>
                    {crimesList.map((c: Crime) => (
                      <option key={c.public_id} value={c.id}>
                        {c.crime_number} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Complainant Name</label>
                <input
                  type="text"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={complainantContact}
                    onChange={(e) => setComplainantContact(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sections of Law</label>
                  <input
                    type="text"
                    value={sectionsOfLaw}
                    onChange={(e) => setSectionsOfLaw(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Complainant Address</label>
                <input
                  type="text"
                  value={complainantAddress}
                  onChange={(e) => setComplainantAddress(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Details & Allegations</label>
                <textarea
                  rows={3}
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setIsCreateModalOpen(false); setFirToEdit(null); }} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button
                  disabled={createMutation.isPending || updateMutation.isPending || (!firToEdit && (!crimeId || !complainantName))}
                  onClick={() => firToEdit ? updateMutation.mutate() : createMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  {firToEdit ? "Save Changes" : "Register FIR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!firToDelete}
        title="Delete FIR Record"
        message={`Are you sure you want to soft delete FIR record ${firToDelete?.fir_number}?`}
        onConfirm={() => firToDelete && deleteMutation.mutate(firToDelete.public_id)}
        onCancel={() => setFirToDelete(null)}
      />
    </div>
  );
}
