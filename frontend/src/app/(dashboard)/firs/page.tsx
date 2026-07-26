"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Printer, Download, Eye, Plus, ShieldCheck, Search, Trash2, X, Inbox, Edit2, RotateCcw } from "lucide-react";
import { firService } from "@/services/firService";
import { crimeService } from "@/services/crimeService";
import { FIR, Crime } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function FIRPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedFIR, setSelectedFIR] = useState<FIR | null>(null);
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
      showToast("FIR registered successfully under CrPC.", "success");
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
      showToast("FIR document updated successfully.", "success");
    }
  });

  // Delete FIR Mutation
  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => firService.deleteFIR(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      showToast("FIR deleted from registry.", "info");
      setFirToDelete(null);
    }
  });

  // Restore FIR Mutation
  const restoreMutation = useMutation({
    mutationFn: (publicId: string) => firService.restoreFIR(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      showToast("FIR restored to active registry.", "success");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>First Information Report (FIR) Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Official legal records registered under Code of Criminal Procedure (CrPC).</p>
        </div>
        <button
          onClick={() => {
            setFirToEdit(null);
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New FIR</span>
        </button>
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
                      <div className="flex items-center justify-end gap-2">
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
                          <span>View FIR</span>
                        </button>
                        <button
                          onClick={() => openEditModal(fir)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
                          title="Edit FIR Document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {showDeleted ? (
                          <button
                            onClick={() => restoreMutation.mutate(fir.public_id)}
                            className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            title="Restore Deleted FIR"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setFirToDelete(fir)}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                            title="Delete FIR"
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

      {/* Register / Edit FIR Modal */}
      {(isCreateModalOpen || firToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setFirToEdit(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">
              {firToEdit ? `Edit FIR - ${firToEdit.fir_number}` : "Register Official FIR Document"}
            </h2>

            <div className="space-y-3 text-xs">
              {!firToEdit && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Crime Record</label>
                  <select
                    value={crimeId}
                    onChange={(e) => setCrimeId(Number(e.target.value))}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="">Select Associated Crime...</option>
                    {crimesList.map((c: Crime) => (
                      <option key={c.public_id} value={c.id}>
                        {c.crime_number} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Complainant Full Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
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
                    placeholder="+91 9876543210"
                    value={complainantContact}
                    onChange={(e) => setComplainantContact(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sections of Law</label>
                  <input
                    type="text"
                    placeholder="e.g. IPC 379, 420"
                    value={sectionsOfLaw}
                    onChange={(e) => setSectionsOfLaw(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">FIR Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                >
                  <option value="Registered">Registered</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Complainant Address</label>
                <input
                  type="text"
                  placeholder="Address details"
                  value={complainantAddress}
                  onChange={(e) => setComplainantAddress(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Statement & Details</label>
                <textarea
                  rows={3}
                  placeholder="Complainant statement and incident details..."
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setFirToEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={firToEdit ? updateMutation.isPending : (!crimeId || !complainantName || !incidentDetails || createMutation.isPending)}
                  onClick={() => firToEdit ? updateMutation.mutate() : createMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-md"
                >
                  {firToEdit ? (updateMutation.isPending ? "Saving..." : "Save Changes") : (createMutation.isPending ? "Registering..." : "Register FIR")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official FIR View Modal */}
      {selectedFIR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-cyan-500/40 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">FORM I - FIRST INFORMATION REPORT</h2>
                  <p className="text-[10px] text-cyan-400 font-mono">Under Section 154 Cr.P.C. • Police Dept</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => firService.downloadPDF(selectedFIR.public_id, selectedFIR.fir_number)}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button onClick={() => setSelectedFIR(null)} className="p-1.5 rounded bg-slate-800 text-slate-200">
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono text-slate-300">
              <div className="grid grid-cols-2 gap-4 bg-[#1c2541]/40 p-3 rounded-lg border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">FIR NUMBER</p>
                  <p className="text-cyan-400 font-bold">{selectedFIR.fir_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">REGISTERED DATE</p>
                  <p className="text-slate-200">{new Date(selectedFIR.registered_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-3 bg-[#1c2541]/40 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Complainant Information</p>
                <p><span className="text-slate-400">Name:</span> {selectedFIR.complainant_name}</p>
                <p><span className="text-slate-400">Contact:</span> {selectedFIR.complainant_contact}</p>
                <p><span className="text-slate-400">Address:</span> {selectedFIR.complainant_address || "N/A"}</p>
              </div>

              <div className="p-3 bg-[#1c2541]/40 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Acts & Sections of Law</p>
                <p className="text-cyan-300 font-bold">{selectedFIR.sections_of_law}</p>
              </div>

              <div className="p-3 bg-[#1c2541]/40 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Statement of Incident Details</p>
                <p className="text-slate-200 leading-relaxed">{selectedFIR.incident_details}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!firToDelete}
        title="Delete FIR Record"
        message={`Are you sure you want to delete FIR ${firToDelete?.fir_number}?`}
        onConfirm={() => firToDelete && deleteMutation.mutate(firToDelete.public_id)}
        onCancel={() => setFirToDelete(null)}
      />
    </div>
  );
}
