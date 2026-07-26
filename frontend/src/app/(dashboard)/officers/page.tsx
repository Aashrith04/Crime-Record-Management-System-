"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeAlert, Search, Edit2, X } from "lucide-react";
import { officerService } from "@/services/officerService";
import { OfficerWorkload, User } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function OfficersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [officerToEdit, setOfficerToEdit] = useState<User | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [rank, setRank] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [stationName, setStationName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { data: officersData, isLoading } = useQuery({
    queryKey: ["officers", search, stationFilter],
    queryFn: () => officerService.getOfficers({ search, station_name: stationFilter }),
  });

  const updateMutation = useMutation({
    mutationFn: () => officerService.updateOfficerProfile(officerToEdit!.public_id, {
      full_name: fullName,
      rank,
      badge_number: badgeNumber,
      station_name: stationName,
      phone_number: phoneNumber
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["officers"] });
      setOfficerToEdit(null);
      showToast("Officer profile updated.", "success");
    }
  });

  const openEditModal = (officer: User) => {
    setOfficerToEdit(officer);
    setFullName(officer.full_name);
    setRank(officer.rank || "");
    setBadgeNumber(officer.badge_number || "");
    setStationName(officer.station_name || "");
    setPhoneNumber(officer.phone_number || "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BadgeAlert className="w-5 h-5 text-cyan-400" />
            <span>Police Roster & Workload Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Active officers, station assignments, active case load, and resolution metrics.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search officer name, badge number, rank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c2541]/50 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Officers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full"><TableSkeleton rows={4} /></div>
        ) : (
          officersData?.data?.items?.map((item: OfficerWorkload) => {
            const { officer, active_cases_count, closed_cases_count, performance_score, availability_status } = item;
            return (
              <div key={officer.public_id} className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl hover:border-slate-700 transition relative">
                <button
                  onClick={() => openEditModal(officer)}
                  className="absolute right-4 top-4 p-1 rounded text-slate-400 hover:text-cyan-400"
                  title="Edit Officer Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-lg">
                    {officer.full_name.charAt(0)}
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0 pr-6">
                    <h3 className="text-sm font-bold text-slate-100 truncate">{officer.full_name}</h3>
                    <p className="text-[11px] text-cyan-400 font-mono">{officer.rank || "Police Officer"} • {officer.badge_number || "IND-POL"}</p>
                    <p className="text-[10px] text-slate-400">{officer.station_name || "Headquarters"}</p>
                  </div>
                </div>

                {/* Workload Pill */}
                <div className="flex items-center justify-between bg-[#1c2541]/40 p-3 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">ACTIVE CASES</p>
                    <p className="text-slate-100 font-bold text-base">{active_cases_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">CLOSED CASES</p>
                    <p className="text-emerald-400 font-bold text-base">{closed_cases_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">PERFORMANCE</p>
                    <p className="text-cyan-400 font-bold text-base">{performance_score}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                    availability_status === "Available" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                    availability_status === "High Workload" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                    "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}>
                    {availability_status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Role: {officer.role?.name || "Officer"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Officer Profile Modal */}
      {officerToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setOfficerToEdit(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">Edit Officer Profile</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Rank</label>
                  <input
                    type="text"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Badge Number</label>
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Police Station Assignment</label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setOfficerToEdit(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
