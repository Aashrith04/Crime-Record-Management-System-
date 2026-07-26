"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldAlert, 
  Clock, 
  MapPin, 
  UserCheck, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  FolderArchive, 
  Users, 
  Plus, 
  ArrowLeft,
  Briefcase
} from "lucide-react";
import { crimeService } from "@/services/crimeService";
import { officerService } from "@/services/officerService";
import { useToast } from "@/components/ui/Toast";
import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function CrimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const publicId = params.id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "evidence" | "investigation">("overview");
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDesc, setTimelineDesc] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | "">("");

  // Fetch Crime Details
  const { data: crimeRes, isLoading, isError } = useQuery({
    queryKey: ["crime", publicId],
    queryFn: () => crimeService.getCrimeById(publicId),
  });

  // Fetch Officers list for assignment
  const { data: officersRes } = useQuery({
    queryKey: ["officers"],
    queryFn: () => officerService.getOfficers({ page_size: 50 }),
  });

  const crime = crimeRes?.data;
  const officers = officersRes?.data?.items || [];

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => crimeService.updateStatus(publicId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crime", publicId] });
      showToast("Crime status updated successfully.", "success");
    },
  });

  // Assign Officer Mutation
  const assignMutation = useMutation({
    mutationFn: (officerId: number) => crimeService.assignOfficer(publicId, officerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crime", publicId] });
      showToast("Officer assigned to crime incident.", "success");
    },
  });

  // Timeline Entry Mutation
  const timelineMutation = useMutation({
    mutationFn: () => crimeService.addTimelineEntry(publicId, { title: timelineTitle, description: timelineDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crime", publicId] });
      showToast("Timeline entry added.", "success");
      setTimelineTitle("");
      setTimelineDesc("");
    },
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !crime) {
    return (
      <div className="p-12 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-200">Crime record not found</p>
        <button onClick={() => router.push("/crimes")} className="px-4 py-2 bg-slate-800 text-xs text-cyan-400 rounded-lg">
          Back to Crimes Registry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/crimes")}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Crimes Registry</span>
        </button>

        <div className="flex gap-2">
          <select
            value={crime.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            className="bg-[#1c2541] border border-slate-700 text-cyan-400 font-semibold text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-cyan-400 px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                {crime.crime_number}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                crime.severity === "Critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-cyan-500/10 text-cyan-400"
              }`}>
                {crime.severity} Severity
              </span>
              <span className="text-xs font-medium text-slate-400">Priority: {crime.priority}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{crime.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-400" /> {new Date(crime.crime_date).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> {crime.location_name}</span>
              <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-cyan-400" /> {crime.assigned_officer ? crime.assigned_officer.full_name : "Unassigned"}</span>
            </div>
          </div>

          {/* Officer Assignment Drawer */}
          <div className="bg-[#1c2541]/40 border border-slate-700/60 rounded-xl p-3 w-full md:w-64 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assign Lead Officer</p>
            <div className="flex gap-2">
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(Number(e.target.value))}
                className="w-full bg-[#0b132b] border border-slate-700 text-xs text-slate-200 rounded px-2 py-1"
              >
                <option value="">Select Officer...</option>
                {officers.map((o) => (
                  <option key={o.officer.public_id} value={o.officer.id}>
                    {o.officer.full_name} ({o.availability_status})
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedOfficerId}
                onClick={() => selectedOfficerId && assignMutation.mutate(Number(selectedOfficerId))}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-4 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2 transition ${activeTab === "overview" ? "text-cyan-400 border-b-2 border-cyan-400 font-bold" : "hover:text-slate-200"}`}
        >
          Overview & Description
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-2 transition ${activeTab === "timeline" ? "text-cyan-400 border-b-2 border-cyan-400 font-bold" : "hover:text-slate-200"}`}
        >
          Crime Timeline ({crime.timeline_entries?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Incident Summary</h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{crime.description}</p>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Offense Category</p>
                <p className="text-slate-200 font-semibold mt-0.5">{crime.crime_type === "Other" ? crime.custom_crime_type : crime.crime_type}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Registration Date</p>
                <p className="text-slate-200 font-semibold mt-0.5">{new Date(crime.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Key Details</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Assigned Station:</span>
                <p className="text-slate-200 font-medium">{crime.assigned_officer?.station_name || "Headquarters"}</p>
              </div>
              <div>
                <span className="text-slate-400">Lead Investigator:</span>
                <p className="text-slate-200 font-medium">{crime.assigned_officer?.full_name || "Not assigned"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Add Timeline Entry Form */}
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Log Activity to Crime Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                placeholder="Event Title..."
                value={timelineTitle}
                onChange={(e) => setTimelineTitle(e.target.value)}
                className="bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
              />
              <input
                type="text"
                placeholder="Event Narrative / Details..."
                value={timelineDesc}
                onChange={(e) => setTimelineDesc(e.target.value)}
                className="bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
              />
            </div>
            <button
              disabled={!timelineTitle || !timelineDesc || timelineMutation.isPending}
              onClick={() => timelineMutation.mutate()}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs rounded-lg shadow-sm"
            >
              Add Timeline Log
            </button>
          </div>

          {/* Timeline Feed */}
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-6">
            <div className="relative border-l border-cyan-500/30 ml-4 space-y-6">
              {crime.timeline_entries?.map((entry) => (
                <div key={entry.public_id} className="relative pl-6">
                  <div className="absolute -left-2 top-0.5 w-4 h-4 rounded-full bg-cyan-500 border-2 border-[#0b132b]" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{entry.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(entry.event_timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300">{entry.description}</p>
                    <p className="text-[10px] text-cyan-400 font-mono">Logged by: {entry.performed_by?.full_name || "System"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
