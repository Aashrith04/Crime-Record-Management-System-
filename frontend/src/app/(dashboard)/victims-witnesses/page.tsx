"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Shield, Plus, Search, X, Edit2, Trash2, RotateCcw } from "lucide-react";
import { victimWitnessService } from "@/services/victimWitnessService";
import { crimeService } from "@/services/crimeService";
import { uploadService } from "@/services/uploadService";
import { Victim, Witness, Crime } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function VictimsWitnessesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"victims" | "witnesses">("victims");
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [victimToEdit, setVictimToEdit] = useState<Victim | null>(null);
  const [witnessToEdit, setWitnessToEdit] = useState<Witness | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: "victim" | "witness"; public_id: string; name: string } | null>(null);

  const [crimeId, setCrimeId] = useState<number | "">("");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [statement, setStatement] = useState("");
  const [medicalReportUrl, setMedicalReportUrl] = useState("");
  const [isProtected, setIsProtected] = useState(false);

  const { data: victimsData, isLoading: isLoadingVictims } = useQuery({
    queryKey: ["victims", search, showDeleted],
    queryFn: () => victimWitnessService.getVictims({ search, is_deleted: showDeleted }),
    enabled: activeTab === "victims",
  });

  const { data: witnessesData, isLoading: isLoadingWitnesses } = useQuery({
    queryKey: ["witnesses", search, showDeleted],
    queryFn: () => victimWitnessService.getWitnesses({ search, is_deleted: showDeleted }),
    enabled: activeTab === "witnesses",
  });

  const { data: crimesData } = useQuery({
    queryKey: ["crimes-select"],
    queryFn: () => crimeService.getCrimes({ page_size: 100 }),
  });

  const resetForm = () => {
    setCrimeId("");
    setFullName("");
    setContact("");
    setAddress("");
    setStatement("");
    setMedicalReportUrl("");
    setIsProtected(false);
  };

  const createVictimMutation = useMutation({
    mutationFn: () =>
      victimWitnessService.createVictim({
        crime_id: Number(crimeId),
        full_name: fullName,
        contact: contact,
        address: address,
        statement: statement,
        medical_report_url: medicalReportUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["victims"] });
      setIsModalOpen(false);
      resetForm();
      showToast("Victim record registered successfully.", "success");
    },
  });

  const updateVictimMutation = useMutation({
    mutationFn: () =>
      victimWitnessService.updateVictim(victimToEdit!.public_id, {
        full_name: fullName,
        contact: contact,
        address: address,
        statement: statement,
        medical_report_url: medicalReportUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["victims"] });
      setVictimToEdit(null);
      resetForm();
      showToast("Victim record updated successfully.", "success");
    },
  });

  const deleteVictimMutation = useMutation({
    mutationFn: (publicId: string) => victimWitnessService.deleteVictim(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["victims"] });
      setItemToDelete(null);
      showToast("Victim record deleted.", "info");
    }
  });

  const restoreVictimMutation = useMutation({
    mutationFn: (publicId: string) => victimWitnessService.restoreVictim(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["victims"] });
      showToast("Victim record restored.", "success");
    }
  });

  const createWitnessMutation = useMutation({
    mutationFn: () =>
      victimWitnessService.createWitness({
        crime_id: Number(crimeId),
        full_name: fullName,
        contact: contact,
        address: address,
        statement: statement,
        is_protected: isProtected,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["witnesses"] });
      setIsModalOpen(false);
      resetForm();
      showToast("Witness statement logged successfully.", "success");
    },
  });

  const updateWitnessMutation = useMutation({
    mutationFn: () =>
      victimWitnessService.updateWitness(witnessToEdit!.public_id, {
        full_name: fullName,
        contact: contact,
        address: address,
        statement: statement,
        is_protected: isProtected,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["witnesses"] });
      setWitnessToEdit(null);
      resetForm();
      showToast("Witness statement updated successfully.", "success");
    },
  });

  const deleteWitnessMutation = useMutation({
    mutationFn: (publicId: string) => victimWitnessService.deleteWitness(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["witnesses"] });
      setItemToDelete(null);
      showToast("Witness record deleted.", "info");
    }
  });

  const restoreWitnessMutation = useMutation({
    mutationFn: (publicId: string) => victimWitnessService.restoreWitness(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["witnesses"] });
      showToast("Witness record restored.", "success");
    }
  });

  const openEditVictim = (v: Victim) => {
    setVictimToEdit(v);
    setFullName(v.full_name);
    setContact(v.contact || "");
    setAddress(v.address || "");
    setStatement(v.statement || "");
    setMedicalReportUrl(v.medical_report_url || "");
  };

  const openEditWitness = (w: Witness) => {
    setWitnessToEdit(w);
    setFullName(w.full_name);
    setContact(w.contact || "");
    setAddress(w.address || "");
    setStatement(w.statement || "");
    setIsProtected(w.is_protected);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <span>Victims & Witness Protection Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official statements, emergency contacts, medical records and witness protection status.
          </p>
        </div>
        <button
          onClick={() => {
            setVictimToEdit(null);
            setWitnessToEdit(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log {activeTab === "victims" ? "Victim Record" : "Witness Statement"}</span>
        </button>
      </div>

      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex gap-2 border-b md:border-b-0 border-slate-800 pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab("victims")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "victims"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Victims Registry
          </button>
          <button
            onClick={() => setActiveTab("witnesses")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "witnesses"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Witness Statements & Protection
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              showDeleted ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-[#1c2541]/50 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {showDeleted ? "Viewing Deleted Records" : "View Active Records"}
          </button>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1c2541]/50 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0b132b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {activeTab === "victims" ? (
          isLoadingVictims ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0e1735] border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Victim Name</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Statement Summary</th>
                    <th className="py-3 px-4">Logged Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {victimsData?.data?.items?.map((v: Victim) => (
                    <tr key={v.public_id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-200">{v.full_name}</td>
                      <td className="py-3 px-4 text-cyan-400 font-mono">{v.contact || "N/A"}</td>
                      <td className="py-3 px-4 text-slate-400">{v.address || "N/A"}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{v.statement || "No statement recorded."}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{new Date(v.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditVictim(v)} className="p-1 rounded text-slate-400 hover:text-cyan-400">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {showDeleted ? (
                            <button onClick={() => restoreVictimMutation.mutate(v.public_id)} className="p-1 rounded text-slate-400 hover:text-emerald-400">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => setItemToDelete({ type: "victim", public_id: v.public_id, name: v.full_name })} className="p-1 rounded text-slate-400 hover:text-rose-400">
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
          )
        ) : isLoadingWitnesses ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0e1735] border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Witness Name</th>
                  <th className="py-3 px-4">Protection Flag</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Statement Log</th>
                  <th className="py-3 px-4">Logged Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {witnessesData?.data?.items?.map((w: Witness) => (
                  <tr key={w.public_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-200">{w.full_name}</td>
                    <td className="py-3 px-4">
                      {w.is_protected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>PROTECTED WITNESS</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-mono">{w.contact || "Protected"}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{w.statement || "Recorded in file."}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditWitness(w)} className="p-1 rounded text-slate-400 hover:text-cyan-400">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {showDeleted ? (
                          <button onClick={() => restoreWitnessMutation.mutate(w.public_id)} className="p-1 rounded text-slate-400 hover:text-emerald-400">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => setItemToDelete({ type: "witness", public_id: w.public_id, name: w.full_name })} className="p-1 rounded text-slate-400 hover:text-rose-400">
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

      {/* Modal: Create / Edit */}
      {(isModalOpen || victimToEdit || witnessToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setVictimToEdit(null);
                setWitnessToEdit(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">
              {victimToEdit ? `Edit Victim - ${victimToEdit.full_name}` : witnessToEdit ? `Edit Witness - ${witnessToEdit.full_name}` : `Log New ${activeTab === "victims" ? "Victim" : "Witness Statement"}`}
            </h2>

            <div className="space-y-3 text-xs">
              {!victimToEdit && !witnessToEdit && (
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

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="Phone number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Address details"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              {(activeTab === "victims" || victimToEdit) && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Medical Examination Report / Attachment</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const res = await uploadService.uploadFile(file);
                            if (res.data) {
                              setMedicalReportUrl(res.data.file_url);
                              showToast("Medical report attached to record.", "success");
                            }
                          } catch (err: any) {
                            showToast("Upload failed.", "error");
                          }
                        }
                      }}
                      className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                    />
                  </div>
                  {medicalReportUrl && (
                    <p className="text-[10px] text-emerald-400 font-mono mt-1 truncate">Attached: {medicalReportUrl}</p>
                  )}
                </div>
              )}

              {(activeTab === "witnesses" || witnessToEdit) && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="protectedCheck"
                    checked={isProtected}
                    onChange={(e) => setIsProtected(e.target.checked)}
                    className="rounded bg-[#1c2541] border-slate-700 text-cyan-500"
                  />
                  <label htmlFor="protectedCheck" className="text-amber-400 font-semibold cursor-pointer">
                    Flag as Witness Protection Act (Shield Identity)
                  </label>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Statement</label>
                <textarea
                  rows={3}
                  placeholder="Official recorded statement..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setVictimToEdit(null);
                    setWitnessToEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={!fullName}
                  onClick={() => {
                    if (victimToEdit) updateVictimMutation.mutate();
                    else if (witnessToEdit) updateWitnessMutation.mutate();
                    else if (activeTab === "victims") createVictimMutation.mutate();
                    else createWitnessMutation.mutate();
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  {(victimToEdit || witnessToEdit) ? "Save Changes" : "Submit Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title={`Delete ${itemToDelete?.type === "victim" ? "Victim" : "Witness"} Record`}
        message={`Are you sure you want to delete record for ${itemToDelete?.name}?`}
        onConfirm={() => {
          if (itemToDelete) {
            if (itemToDelete.type === "victim") deleteVictimMutation.mutate(itemToDelete.public_id);
            else deleteWitnessMutation.mutate(itemToDelete.public_id);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
