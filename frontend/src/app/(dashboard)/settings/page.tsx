"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, Shield, Database, Palette, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { settingsService, DepartmentSettingsData } from "@/services/settingsService";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"general" | "categories" | "stations">("general");

  // State
  const [settingsData, setSettingsData] = useState<DepartmentSettingsData>({
    crime_categories: [],
    evidence_categories: [],
    ranks: [],
    police_stations: [],
    storage_locations: [],
    case_priorities: [],
    theme: "dark"
  });

  const [newCategory, setNewCategory] = useState("");
  const [newStation, setNewStation] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const { data: configRes, isLoading } = useQuery({
    queryKey: ["department-settings"],
    queryFn: () => settingsService.getSettings(),
  });

  useEffect(() => {
    if (configRes?.data) {
      setSettingsData(configRes.data);
    }
  }, [configRes]);

  const updateMutation = useMutation({
    mutationFn: () => settingsService.updateSettings(settingsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-settings"] });
      showToast("Department settings saved successfully.", "success");
    },
    onError: (err: any) => {
      showToast("Failed to save settings: " + (err.response?.data?.message || err.message), "error");
    }
  });

  if (isLoading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Department & System Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure crime categories, police station list, vault storage locations, and system preferences.</p>
        </div>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{updateMutation.isPending ? "Saving..." : "Save Department Settings"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 flex gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "general" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          General & Priorities
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "categories" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Crime & Evidence Offense Types
        </button>
        <button
          onClick={() => setActiveTab("stations")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "stations" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Police Stations & Vault Locations
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        {activeTab === "general" && (
          <div className="space-y-4 max-w-xl text-xs">
            <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">System Theme & Case Priorities</h2>
            <div>
              <label className="block text-slate-300 font-medium mb-1">System Portal Theme</label>
              <select
                value={settingsData.theme}
                onChange={(e) => setSettingsData({ ...settingsData, theme: e.target.value })}
                className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="dark">Enterprise Slate Dark (Default)</option>
                <option value="high-contrast">High Contrast Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Active Case Priorities</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {settingsData.case_priorities?.map((priority) => (
                  <span key={priority} className="px-3 py-1 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-mono">
                    {priority}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">Crime Offense Categories</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Crime Category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
                <button
                  onClick={() => {
                    if (newCategory.trim()) {
                      setSettingsData({
                        ...settingsData,
                        crime_categories: [...settingsData.crime_categories, newCategory.trim()]
                      });
                      setNewCategory("");
                    }
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {settingsData.crime_categories?.map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#1c2541]/30 rounded-lg border border-slate-800">
                    <span className="text-slate-200">{cat}</span>
                    <button
                      onClick={() => {
                        setSettingsData({
                          ...settingsData,
                          crime_categories: settingsData.crime_categories.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">Evidence Media Categories</h2>
              <div className="space-y-1">
                {settingsData.evidence_categories?.map((evCat, idx) => (
                  <div key={idx} className="p-2 bg-[#1c2541]/30 rounded-lg border border-slate-800 text-slate-300">
                    {evCat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "stations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">Police Stations List</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Police Station..."
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="flex-1 bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
                <button
                  onClick={() => {
                    if (newStation.trim()) {
                      setSettingsData({
                        ...settingsData,
                        police_stations: [...settingsData.police_stations, newStation.trim()]
                      });
                      setNewStation("");
                    }
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {settingsData.police_stations?.map((st, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#1c2541]/30 rounded-lg border border-slate-800">
                    <span className="text-slate-200">{st}</span>
                    <button
                      onClick={() => {
                        setSettingsData({
                          ...settingsData,
                          police_stations: settingsData.police_stations.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">Vault Storage Locations</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Storage Location..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="flex-1 bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
                <button
                  onClick={() => {
                    if (newLocation.trim()) {
                      setSettingsData({
                        ...settingsData,
                        storage_locations: [...settingsData.storage_locations, newLocation.trim()]
                      });
                      setNewLocation("");
                    }
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {settingsData.storage_locations?.map((loc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#1c2541]/30 rounded-lg border border-slate-800">
                    <span className="text-slate-200">{loc}</span>
                    <button
                      onClick={() => {
                        setSettingsData({
                          ...settingsData,
                          storage_locations: settingsData.storage_locations.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
