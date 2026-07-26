"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FolderArchive, Plus, Search, Eye, FileText, Image as ImageIcon, Video, 
  History, Barcode, X, ArrowRightLeft, Edit2, Trash2, RotateCcw, Upload, 
  CheckCircle2, Download, ExternalLink, Loader2
} from "lucide-react";
import { evidenceService } from "@/services/evidenceService";
import { crimeService } from "@/services/crimeService";
import { Evidence, Crime } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExportButtons } from "@/components/ui/ExportButtons";

export default function EvidenceLockerPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [evidenceToEdit, setEvidenceToEdit] = useState<Evidence | null>(null);
  const [evidenceToDelete, setEvidenceToDelete] = useState<Evidence | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [custodyModalEvidence, setCustodyModalEvidence] = useState<Evidence | null>(null);

  // Upload Form State
  const [crimeId, setCrimeId] = useState<number | "">("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"image" | "video" | "audio" | "pdf" | "document">("image");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [storageLocation, setStorageLocation] = useState("Central Vault Locker A-1");
  const [status, setStatus] = useState("In Locker");
  const [isUploading, setIsUploading] = useState(false);

  // Custody Move Form
  const [custodyAction, setCustodyAction] = useState("Transferred to Lab");
  const [movedTo, setMovedTo] = useState("Forensic Lab 3B");
  const [custodyNotes, setCustodyNotes] = useState("");

  // Queries
  const { data: evidenceData, isLoading } = useQuery({
    queryKey: ["evidences", search, fileTypeFilter, statusFilter, showDeleted],
    queryFn: () => evidenceService.getEvidences({ search, file_type: fileTypeFilter, status: statusFilter, is_deleted: showDeleted }),
  });

  const { data: crimesData } = useQuery({
    queryKey: ["crimes-select"],
    queryFn: () => crimeService.getCrimes({ page_size: 100 }),
  });

  // Handle Local File Pick
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!fileName) setFileName(file.name);
    
    if (file.type.startsWith("image/")) setFileType("image");
    else if (file.type.startsWith("video/")) setFileType("video");
    else if (file.type.includes("pdf")) setFileType("pdf");
    else if (file.type.startsWith("audio/")) setFileType("audio");
  };

  // Submit Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("crime_id", String(crimeId));
        formData.append("file_name", fileName || selectedFile.name);
        formData.append("file_type", fileType);
        if (description) formData.append("description", description);
        formData.append("storage_location", storageLocation);
        return evidenceService.uploadEvidenceFile(formData);
      } else {
        return evidenceService.uploadEvidence({
          crime_id: Number(crimeId),
          file_name: fileName,
          file_type: fileType,
          file_url: fileUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600",
          description,
          storage_location: storageLocation,
          status: "In Locker"
        });
      }
    },
    onSuccess: (res) => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["evidences"] });
      setIsUploadModalOpen(false);
      resetForm();
      showToast("Evidence file uploaded and secured in Evidence Locker.", "success");
    },
    onError: (err: any) => {
      setIsUploading(false);
      showToast(err.response?.data?.message || "Failed to upload evidence item.", "error");
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: () => evidenceService.updateEvidence(evidenceToEdit!.public_id, {
      file_name: fileName,
      file_type: fileType,
      file_url: fileUrl,
      description,
      storage_location: storageLocation,
      status: status as any
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidences"] });
      setEvidenceToEdit(null);
      resetForm();
      showToast("Evidence item updated successfully.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Failed to update evidence.", "error");
    }
  });

  // Custody Move Mutation
  const custodyMutation = useMutation({
    mutationFn: () => evidenceService.moveCustody(custodyModalEvidence!.public_id, {
      action: custodyAction,
      moved_to: movedTo,
      notes: custodyNotes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidences"] });
      setCustodyModalEvidence(null);
      showToast("Chain of Custody movement recorded.", "success");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => evidenceService.deleteEvidence(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidences"] });
      showToast("Evidence item deleted from locker.", "info");
      setEvidenceToDelete(null);
    }
  });

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: (publicId: string) => evidenceService.restoreEvidence(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidences"] });
      showToast("Evidence item restored to active locker.", "success");
    }
  });

  const resetForm = () => {
    setCrimeId("");
    setFileName("");
    setFileType("image");
    setFileUrl("");
    setSelectedFile(null);
    setDescription("");
    setStorageLocation("Central Vault Locker A-1");
    setStatus("In Locker");
  };

  const openEditModal = (ev: Evidence) => {
    setEvidenceToEdit(ev);
    setFileName(ev.file_name);
    setFileType(ev.file_type);
    setFileUrl(ev.file_url);
    setDescription(ev.description || "");
    setStorageLocation(ev.storage_location);
    setStatus(ev.status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-cyan-400" />
            <span>Digital & Forensic Evidence Locker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Immutable evidence registry, custody movement history, barcode tracking and media previews.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <ExportButtons entity="evidences" status={statusFilter} />
          <button
            onClick={() => {
              setEvidenceToEdit(null);
              resetForm();
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Evidence Item</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search evidence ID, barcode, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c2541]/50 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              showDeleted ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-[#1c2541]/50 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {showDeleted ? "Viewing Deleted Evidences" : "View Active Evidences"}
          </button>

          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="bg-[#1c2541]/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Media Types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="pdf">PDF Document</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1c2541]/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="In Locker">In Locker</option>
            <option value="In Lab">In Forensic Lab</option>
            <option value="Court Presentation">Court Presentation</option>
          </select>
        </div>
      </div>

      {/* Evidence Locker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full"><TableSkeleton rows={4} /></div>
        ) : (
          evidenceData?.data?.items?.map((ev: Evidence) => (
            <div key={ev.public_id} className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-3 relative hover:border-slate-700 transition shadow-lg">
              {/* Media Preview Box */}
              <div className="h-36 bg-[#1c2541]/60 rounded-lg border border-slate-800 overflow-hidden relative flex items-center justify-center">
                {ev.file_type === "image" ? (
                  <img src={ev.file_url} alt={ev.file_name} className="w-full h-full object-cover" />
                ) : ev.file_type === "video" ? (
                  <div className="text-center space-y-1">
                    <Video className="w-8 h-8 text-cyan-400 mx-auto" />
                    <span className="text-[10px] text-slate-400 font-mono">Video Asset Preview</span>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                    <span className="text-[10px] text-slate-400 font-mono">PDF Document Asset</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                  {ev.evidence_number}
                </span>
                <button
                  onClick={() => setSelectedEvidence(ev)}
                  className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/70 text-cyan-400 hover:bg-black/90 transition"
                  title="View Full Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-bold text-slate-100 truncate flex-1">{ev.file_name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    {ev.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{ev.description || "No description logged."}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-1">
                  <Barcode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Barcode: {ev.barcode || "BC-CRMS-991204"}</span>
                </div>
                <p className="text-[10px] text-slate-400"><span className="text-slate-500">Location:</span> {ev.storage_location}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => setCustodyModalEvidence(ev)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer Custody</span>
                </button>

                <div className="flex gap-2 items-center">
                  <a
                    href={ev.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-slate-400 hover:text-cyan-400"
                    title="Download / Open File Asset"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => openEditModal(ev)}
                    className="p-1 rounded text-slate-400 hover:text-cyan-400"
                    title="Edit Evidence Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {showDeleted ? (
                    <button
                      onClick={() => restoreMutation.mutate(ev.public_id)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400"
                      title="Restore Evidence Item"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setEvidenceToDelete(ev)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Delete Evidence Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload / Edit Modal */}
      {(isUploadModalOpen || evidenceToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setEvidenceToEdit(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">
              {evidenceToEdit ? `Edit Evidence - ${evidenceToEdit.evidence_number}` : "Upload Evidence Item"}
            </h2>

            <div className="space-y-3 text-xs">
              {!evidenceToEdit && (
                <>
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

                  {/* Real File Upload Input */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Select Evidence File to Upload</label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 text-center bg-[#1c2541]/30 transition relative cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFilePick}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {selectedFile ? (
                        <div className="space-y-1 text-emerald-400 font-medium flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="truncate max-w-xs">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-400">
                          <Upload className="w-6 h-6 mx-auto text-cyan-400" />
                          <p className="font-medium text-slate-200">Click or Drag file to upload to Vault Storage</p>
                          <p className="text-[10px] text-slate-500">Supports Images, Videos, PDFs, Audio, Docs</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">File Label / Title</label>
                <input
                  type="text"
                  placeholder="CCTV_Footage_Vault.mp4"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Media Type</label>
                  <select
                    value={fileType}
                    onChange={(e: any) => setFileType(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="pdf">PDF Document</option>
                    <option value="audio">Audio Recording</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {evidenceToEdit && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="In Locker">In Locker</option>
                    <option value="In Lab">In Lab</option>
                    <option value="Court Presentation">Court Presentation</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Findings</label>
                <textarea
                  rows={3}
                  placeholder="Forensic details and item description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setEvidenceToEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={uploadMutation.isPending || isUploading || (evidenceToEdit ? updateMutation.isPending : (!crimeId || (!selectedFile && !fileName)))}
                  onClick={() => evidenceToEdit ? updateMutation.mutate() : uploadMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md flex items-center gap-1.5"
                >
                  {(uploadMutation.isPending || isUploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{evidenceToEdit ? (updateMutation.isPending ? "Saving..." : "Save Changes") : ((uploadMutation.isPending || isUploading) ? "Uploading & Securing..." : "Upload & Secure")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setSelectedEvidence(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-100">{selectedEvidence.evidence_number} - {selectedEvidence.file_name}</h2>

            <div className="bg-[#1c2541]/40 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[250px] max-h-[400px]">
              {selectedEvidence.file_type === "image" ? (
                <img src={selectedEvidence.file_url} alt={selectedEvidence.file_name} className="max-h-[380px] w-auto object-contain" />
              ) : selectedEvidence.file_type === "video" ? (
                <video src={selectedEvidence.file_url} controls className="max-h-[380px] w-full" />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-12 h-12 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">Document Asset ({selectedEvidence.file_type.toUpperCase()})</p>
                  <a
                    href={selectedEvidence.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open External File Asset</span>
                  </a>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p><span className="text-slate-500">Location:</span> {selectedEvidence.storage_location}</p>
              <p><span className="text-slate-500">Barcode:</span> {selectedEvidence.barcode}</p>
              <p><span className="text-slate-500">Description:</span> {selectedEvidence.description || "N/A"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Custody Modal */}
      {custodyModalEvidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setCustodyModalEvidence(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-100">Record Chain of Custody Movement</h2>
            <p className="text-xs text-cyan-400 font-mono">{custodyModalEvidence.evidence_number} - {custodyModalEvidence.file_name}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Transfer Action</label>
                <select
                  value={custodyAction}
                  onChange={(e) => setCustodyAction(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                >
                  <option value="Transferred to Lab">Transferred to Forensic Lab</option>
                  <option value="Presented in Court">Presented in Court</option>
                  <option value="Checked Out">Checked Out by Officer</option>
                  <option value="Returned">Returned to Locker</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Destination Location</label>
                <input
                  type="text"
                  value={movedTo}
                  onChange={(e) => setMovedTo(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Handover Notes / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Reason for movement..."
                  value={custodyNotes}
                  onChange={(e) => setCustodyNotes(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setCustodyModalEvidence(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button
                  disabled={custodyMutation.isPending}
                  onClick={() => custodyMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  Record Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!evidenceToDelete}
        title="Delete Evidence Item"
        message={`Are you sure you want to delete evidence item ${evidenceToDelete?.evidence_number}?`}
        onConfirm={() => evidenceToDelete && deleteMutation.mutate(evidenceToDelete.public_id)}
        onCancel={() => setEvidenceToDelete(null)}
      />
    </div>
  );
}
