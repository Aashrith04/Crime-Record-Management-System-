"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, Trash2, Eye, ShieldAlert, X, Link as LinkIcon, Edit2, RotateCcw } from "lucide-react";
import { criminalService } from "@/services/criminalService";
import { crimeService } from "@/services/crimeService";
import { Criminal, Crime } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function CriminalsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [criminalToEdit, setCriminalToEdit] = useState<Criminal | null>(null);
  const [criminalToDelete, setCriminalToDelete] = useState<Criminal | null>(null);
  const [linkCriminal, setLinkCriminal] = useState<Criminal | null>(null);
  const [selectedCrimeId, setSelectedCrimeId] = useState<number | "">("");
  const [roleInCrime, setRoleInCrime] = useState("Suspect");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [alias, setAlias] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");
  const [identificationMarks, setIdentificationMarks] = useState("");
  const [wantedStatus, setWantedStatus] = useState("Wanted");

  // Fetch Criminal Profiles
  const { data: criminalData, isLoading } = useQuery({
    queryKey: ["criminals", search, statusFilter, showDeleted, page],
    queryFn: () => criminalService.getCriminals({ search, wanted_status: statusFilter, is_deleted: showDeleted, page }),
  });

  // Fetch Crimes for Link Modal
  const { data: crimesData } = useQuery({
    queryKey: ["crimes-for-link"],
    queryFn: () => crimeService.getCrimes({ page_size: 100 }),
  });

  // Create Criminal Profile Mutation
  const createMutation = useMutation({
    mutationFn: () => criminalService.createCriminal({
      full_name: fullName,
      alias,
      photo_url: photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      gender,
      address,
      identification_marks: identificationMarks,
      wanted_status: wantedStatus as any
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criminals"] });
      setIsModalOpen(false);
      resetForm();
      showToast("Criminal offender profile created.", "success");
    }
  });

  // Update Criminal Mutation
  const updateMutation = useMutation({
    mutationFn: () => criminalService.updateCriminal(criminalToEdit!.public_id, {
      full_name: fullName,
      alias,
      photo_url: photoUrl,
      gender,
      address,
      identification_marks: identificationMarks,
      wanted_status: wantedStatus as any
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criminals"] });
      setCriminalToEdit(null);
      resetForm();
      showToast("Criminal offender profile updated.", "success");
    }
  });

  // Link Crime Mutation
  const linkMutation = useMutation({
    mutationFn: () => criminalService.linkToCrime(linkCriminal!.public_id, Number(selectedCrimeId), roleInCrime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criminals"] });
      setLinkCriminal(null);
      setSelectedCrimeId("");
      showToast("Criminal linked to crime incident.", "success");
    }
  });

  // Delete Criminal Mutation
  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => criminalService.deleteCriminal(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criminals"] });
      showToast("Criminal profile removed.", "info");
      setCriminalToDelete(null);
    }
  });

  // Restore Criminal Mutation
  const restoreMutation = useMutation({
    mutationFn: (publicId: string) => criminalService.restoreCriminal(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criminals"] });
      showToast("Criminal profile restored to active registry.", "success");
    }
  });

  const resetForm = () => {
    setFullName("");
    setAlias("");
    setPhotoUrl("");
    setGender("Male");
    setAddress("");
    setIdentificationMarks("");
    setWantedStatus("Wanted");
  };

  const openEditModal = (c: Criminal) => {
    setCriminalToEdit(c);
    setFullName(c.full_name);
    setAlias(c.alias || "");
    setPhotoUrl(c.photo_url || "");
    setGender(c.gender || "Male");
    setAddress(c.address || "");
    setIdentificationMarks(c.identification_marks || "");
    setWantedStatus(c.wanted_status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Criminal Offender Profiles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Central database of known offenders, aliases, mugshots, risk status, and crime histories.</p>
        </div>
        <button
          onClick={() => {
            setCriminalToEdit(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Offender Profile</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search offender name, alias, marks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c2541]/50 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              showDeleted ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-[#1c2541]/50 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {showDeleted ? "Viewing Deleted Profiles" : "View Active Profiles"}
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1c2541]/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Wanted">Wanted</option>
            <option value="Arrested">Arrested</option>
            <option value="Absconding">Absconding</option>
            <option value="Released">Released</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full"><TableSkeleton rows={4} /></div>
        ) : (
          criminalData?.data?.items?.map((c: Criminal) => (
            <div key={c.public_id} className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-3 relative hover:border-slate-700 transition shadow-lg">
              <div className="flex gap-3 items-center">
                <img
                  src={c.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                  alt={c.full_name}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-700 bg-slate-800"
                />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    c.wanted_status === "Wanted" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                    c.wanted_status === "Arrested" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>
                    {c.wanted_status}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 truncate">{c.full_name}</h3>
                  <p className="text-[11px] text-cyan-400 font-mono">Alias: {c.alias || "None"}</p>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 bg-[#1c2541]/40 p-2.5 rounded-lg border border-slate-800/80">
                <p><span className="text-slate-500">Gender:</span> {c.gender || "Unknown"}</p>
                <p><span className="text-slate-500">Marks:</span> {c.identification_marks || "N/A"}</p>
                <p className="truncate"><span className="text-slate-500">Address:</span> {c.address || "N/A"}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => setLinkCriminal(c)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Link to Crime</span>
                </button>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1 rounded text-slate-400 hover:text-cyan-400"
                    title="Edit Offender Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {showDeleted ? (
                    <button
                      onClick={() => restoreMutation.mutate(c.public_id)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400"
                      title="Restore Profile"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setCriminalToDelete(c)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Offender Modal */}
      {(isModalOpen || criminalToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setCriminalToEdit(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">
              {criminalToEdit ? `Edit Offender Profile - ${criminalToEdit.full_name}` : "Create Offender Profile"}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Alias / Known As</label>
                  <input
                    type="text"
                    placeholder="Nickname / Alias"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Wanted Status</label>
                  <select
                    value={wantedStatus}
                    onChange={(e) => setWantedStatus(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="Wanted">Wanted</option>
                    <option value="Arrested">Arrested</option>
                    <option value="Absconding">Absconding</option>
                    <option value="Released">Released</option>
                    <option value="Not Wanted">Not Wanted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mugshot / Photo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Identification Marks / Tattoos</label>
                <input
                  type="text"
                  placeholder="Scar on left cheek, tattoo on right arm"
                  value={identificationMarks}
                  onChange={(e) => setIdentificationMarks(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Known Address</label>
                <input
                  type="text"
                  placeholder="Residential address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setCriminalToEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={!fullName || (criminalToEdit ? updateMutation.isPending : createMutation.isPending)}
                  onClick={() => criminalToEdit ? updateMutation.mutate() : createMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  {criminalToEdit ? (updateMutation.isPending ? "Saving..." : "Save Changes") : (createMutation.isPending ? "Creating..." : "Create Profile")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link to Crime Modal */}
      {linkCriminal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setLinkCriminal(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-100">Link Offender to Crime Incident</h2>
            <p className="text-xs text-cyan-400 font-mono">Offender: {linkCriminal.full_name}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Crime Incident</label>
                <select
                  value={selectedCrimeId}
                  onChange={(e) => setSelectedCrimeId(Number(e.target.value))}
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

              <div>
                <label className="block text-slate-300 font-medium mb-1">Role in Crime</label>
                <select
                  value={roleInCrime}
                  onChange={(e) => setRoleInCrime(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                >
                  <option value="Prime Suspect">Prime Suspect</option>
                  <option value="Accomplice">Accomplice</option>
                  <option value="Convicted">Convicted</option>
                  <option value="Suspect">Suspect</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setLinkCriminal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button
                  disabled={!selectedCrimeId || linkMutation.isPending}
                  onClick={() => linkMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  Confirm Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!criminalToDelete}
        title="Delete Criminal Profile"
        message={`Are you sure you want to remove profile for ${criminalToDelete?.full_name}?`}
        onConfirm={() => criminalToDelete && deleteMutation.mutate(criminalToDelete.public_id)}
        onCancel={() => setCriminalToDelete(null)}
      />
    </div>
  );
}
