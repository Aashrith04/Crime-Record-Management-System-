"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  X, 
  ShieldAlert,
  Inbox,
  RotateCcw,
  Edit2
} from "lucide-react";
import { api } from "@/services/api";
import { crimeService } from "@/services/crimeService";
import { Crime } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExportButtons } from "@/components/ui/ExportButtons";

const crimeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  crime_type: z.string().min(1, "Select crime type"),
  custom_crime_type: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  crime_date: z.string().min(1, "Select crime date"),
  location_name: z.string().min(3, "Enter location"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  priority: z.string().default("Medium"),
  severity: z.string().default("Moderate"),
  status: z.string().default("Open"),
}).refine(data => {
  if (data.crime_type === "Other" && !data.custom_crime_type) {
    return false;
  }
  return true;
}, {
  message: "Specify custom crime type when 'Other' is selected",
  path: ["custom_crime_type"],
});

type CrimeFormInputs = z.infer<typeof crimeSchema>;

export default function CrimesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crimeToEdit, setCrimeToEdit] = useState<Crime | null>(null);
  const [crimeToDelete, setCrimeToDelete] = useState<Crime | null>(null);

  // React Query Fetch Crimes
  const { data, isLoading } = useQuery({
    queryKey: ["crimes", search, statusFilter, severityFilter, showDeleted, page],
    queryFn: () => crimeService.getCrimes({
      search: search || undefined,
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
      is_deleted: showDeleted,
      page,
      page_size: 10,
    }).then(res => res.data),
  });

  // Create Crime Mutation
  const createMutation = useMutation({
    mutationFn: async (formData: CrimeFormInputs) => {
      const payload = {
        ...formData,
        crime_date: new Date(formData.crime_date).toISOString(),
        priority: formData.priority as any,
        severity: formData.severity as any,
        status: formData.status as any,
      };
      return crimeService.createCrime(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crimes"] });
      setIsModalOpen(false);
      reset();
      showToast("Crime incident file registered successfully.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Failed to register crime.", "error");
    }
  });

  // Update Crime Mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: CrimeFormInputs) => {
      const payload = {
        ...formData,
        crime_date: new Date(formData.crime_date).toISOString(),
        priority: formData.priority as any,
        severity: formData.severity as any,
        status: formData.status as any,
      };
      return crimeService.updateCrime(crimeToEdit!.public_id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crimes"] });
      setCrimeToEdit(null);
      reset();
      showToast("Crime record updated successfully.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Failed to update crime.", "error");
    }
  });

  // Soft Delete Crime Mutation
  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => crimeService.deleteCrime(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crimes"] });
      showToast("Crime record soft deleted from registry.", "info");
      setCrimeToDelete(null);
    },
    onError: () => {
      showToast("Failed to delete crime record.", "error");
    }
  });

  // Restore Crime Mutation
  const restoreMutation = useMutation({
    mutationFn: (publicId: string) => crimeService.restoreCrime(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crimes"] });
      showToast("Crime record restored to active registry.", "success");
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CrimeFormInputs>({
    resolver: zodResolver(crimeSchema),
    defaultValues: {
      crime_type: "Robbery",
      priority: "Medium",
      severity: "Moderate",
      status: "Open",
      crime_date: new Date().toISOString().split("T")[0],
    },
  });

  const watchCrimeType = watch("crime_type");

  const openEditModal = (crime: Crime) => {
    setCrimeToEdit(crime);
    setValue("title", crime.title);
    setValue("crime_type", crime.crime_type);
    setValue("custom_crime_type", crime.custom_crime_type || "");
    setValue("description", crime.description);
    setValue("crime_date", crime.crime_date ? new Date(crime.crime_date).toISOString().split("T")[0] : "");
    setValue("location_name", crime.location_name);
    setValue("priority", crime.priority);
    setValue("severity", crime.severity);
    setValue("status", crime.status);
  };

  const onSubmit = (formData: CrimeFormInputs) => {
    if (crimeToEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>Crime Incident Records</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Official registry of reported criminal offenses, case timelines and officer assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <ExportButtons entity="crimes" status={statusFilter} />
          <button
            onClick={() => {
              setCrimeToEdit(null);
              reset();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Crime</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, CR number, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c2541]/50 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              showDeleted ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-[#1c2541]/50 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {showDeleted ? "Viewing Deleted Records" : "View Active Records"}
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1c2541]/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#1c2541]/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="Minor">Minor</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : data?.items?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">No crime incident files found</p>
            <p className="text-xs text-slate-500">Try clearing active search filters or register a new crime incident.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0e1735] border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Crime Number</th>
                  <th className="py-3 px-4">Incident Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {data?.items?.map((c: Crime) => (
                  <tr key={c.public_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-medium">{c.crime_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{c.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {c.crime_type === "Other" ? c.custom_crime_type : c.crime_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.severity === "Critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                        c.severity === "Severe" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                        "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        c.status === "Closed" ? "bg-emerald-500/10 text-emerald-400" :
                        c.status === "Under Investigation" ? "bg-blue-500/10 text-blue-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">{c.location_name}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/crimes/${c.public_id}`}
                          className="p-1.5 rounded hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition"
                          title="View Crime Details"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition"
                          title="Edit Crime Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {showDeleted ? (
                          <button
                            onClick={() => restoreMutation.mutate(c.public_id)}
                            className="p-1.5 rounded hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition"
                            title="Restore Soft Deleted Record"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setCrimeToDelete(c)}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                            title="Soft Delete Crime Record"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {data && data.total > 0 && (
          <div className="p-3 bg-[#0e1735] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Page {data.page} of {data.total_pages} (Total: {data.total})</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Register / Edit Crime */}
      {(isModalOpen || crimeToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setCrimeToEdit(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100 mb-4">
              {crimeToEdit ? `Edit Crime Record - ${crimeToEdit.crime_number}` : "Register Criminal Incident File"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Title</label>
                <input
                  {...register("title")}
                  placeholder="e.g. Armed Jewellery Robbery"
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
                {errors.title && <p className="text-rose-400 mt-0.5">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Crime Type</label>
                  <select
                    {...register("crime_type")}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="Robbery">Robbery</option>
                    <option value="Cybercrime">Cybercrime</option>
                    <option value="Assault">Assault</option>
                    <option value="Theft">Theft</option>
                    <option value="Homicide">Homicide</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {watchCrimeType === "Other" && (
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Custom Crime Type</label>
                    <input
                      {...register("custom_crime_type")}
                      placeholder="Specify custom offense..."
                      className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    />
                    {errors.custom_crime_type && <p className="text-rose-400 mt-0.5">{errors.custom_crime_type.message}</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Detailed Description</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Comprehensive narrative of the incident..."
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
                {errors.description && <p className="text-rose-400 mt-0.5">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Crime Date</label>
                  <input
                    {...register("crime_date")}
                    type="date"
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Location Address</label>
                  <input
                    {...register("location_name")}
                    placeholder="Sector / Landmark"
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Severity Level</label>
                  <select
                    {...register("severity")}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    {...register("priority")}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCrimeToEdit(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-500/20"
                >
                  {crimeToEdit ? (updateMutation.isPending ? "Updating..." : "Save Changes") : (createMutation.isPending ? "Submitting..." : "Submit File")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!crimeToDelete}
        title="Delete Crime Incident File"
        message={`Are you sure you want to soft delete crime record ${crimeToDelete?.crime_number}? This action will be logged in the immutable security audit log.`}
        confirmText="Confirm Soft Delete"
        onConfirm={() => {
          if (crimeToDelete) {
            deleteMutation.mutate(crimeToDelete.public_id);
          }
        }}
        onCancel={() => setCrimeToDelete(null)}
      />
    </div>
  );
}
