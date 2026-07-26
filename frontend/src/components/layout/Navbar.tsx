"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Bell, LogOut, Shield, Check, CheckCheck, ExternalLink, X, Tag } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Breadcrumb } from "./Breadcrumb";
import { searchService, SearchResultItem } from "@/services/searchService";
import { notificationService, NotificationItem } from "@/services/notificationService";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Search Query
  const { data: searchRes } = useQuery({
    queryKey: ["global-search", searchQuery, activeCategory],
    queryFn: () => searchService.globalSearch({ q: searchQuery, category: activeCategory }),
    enabled: searchQuery.trim().length > 0,
  });

  // Notifications Query
  const { data: notifRes } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => notificationService.getNotifications(10),
    refetchInterval: 10000,
  });

  const notifItems = notifRes?.data?.items || [];
  const unreadCount = notifRes?.data?.unread_count || 0;

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    }
  });

  // Mark All Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    }
  });

  // Click outside listener for notifications popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = searchRes?.data?.items || [];
  const suggestions = searchRes?.data?.suggestions || ["Armed Robbery", "Cyber Park", "EVD-2026", "FIR-2026", "Viper"];

  return (
    <header className="h-16 bg-[#0b132b]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left Breadcrumb & Global Search Input */}
      <div className="flex items-center gap-6">
        <Breadcrumb />

        {/* Global Search Input Box */}
        <div className="relative w-80 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Global Search (CR#, FIR#, Name, Barcode...)"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            className="w-full bg-[#1c2541]/60 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Global Search Popup Drawer */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-[#0b132b] border border-cyan-500/30 rounded-xl shadow-2xl p-3 z-50 space-y-3 max-h-[80vh] overflow-y-auto w-[420px]">
              {/* Category Filter Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
                {["all", "crimes", "firs", "criminals", "evidence", "victims", "witnesses", "officers"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2 py-0.5 rounded uppercase font-bold transition ${
                      activeCategory === cat ? "bg-cyan-500 text-black" : "bg-[#1c2541] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>Suggestions:</span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSearchQuery(s)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Results List */}
              <div className="space-y-1">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No matching enterprise records found.</p>
                ) : (
                  searchResults.map((item: SearchResultItem, idx: number) => (
                    <a
                      key={idx}
                      href={item.detail_url}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-start justify-between p-2 rounded-lg bg-[#1c2541]/40 hover:bg-slate-800/80 transition border border-slate-800/80 text-xs block group"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 group-hover:text-cyan-300 truncate">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.badge_color === "rose" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        }`}>
                          {item.badge_text}
                        </span>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono">{item.created_at}</p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Real-time Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 top-11 bg-[#0b132b] border border-slate-800 rounded-xl shadow-2xl p-4 w-80 z-50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifItems.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No recent notifications.</p>
                ) : (
                  notifItems.map((n: NotificationItem) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs space-y-1 transition ${
                        n.is_read ? "bg-[#1c2541]/20 border-slate-800 text-slate-400" : "bg-[#1c2541]/70 border-cyan-500/30 text-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-cyan-400 text-[11px]">{n.title}</h4>
                        {!n.is_read && (
                          <button
                            onClick={() => markReadMutation.mutate(n.id)}
                            className="text-slate-400 hover:text-emerald-400"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug">{n.message}</p>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                        <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {n.link && (
                          <a href={n.link} className="text-cyan-400 hover:underline flex items-center gap-0.5">
                            <span>View File</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>{user?.role?.name || "Police Officer"}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
          title="Sign out of police portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
