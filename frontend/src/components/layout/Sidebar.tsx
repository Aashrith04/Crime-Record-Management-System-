"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  FileText, 
  Users, 
  UserCheck,
  FolderArchive,
  Search,
  BadgeAlert,
  MapPin, 
  BarChart3, 
  BrainCircuit, 
  History, 
  ShieldCheck,
  Briefcase,
  UserCheck2,
  Settings
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Officer Workspace", href: "/officer-workspace", icon: UserCheck2 },
  { label: "Crime Records", href: "/crimes", icon: ShieldAlert },
  { label: "FIR Registry", href: "/firs", icon: FileText },
  { label: "Criminal Profiles", href: "/criminals", icon: Users },
  { label: "Victims & Witnesses", href: "/victims-witnesses", icon: UserCheck },
  { label: "Evidence Locker", href: "/evidence", icon: FolderArchive },
  { label: "Investigations", href: "/investigations", icon: Briefcase },
  { label: "Officer Roster", href: "/officers", icon: BadgeAlert },
  { label: "GIS Crime Map", href: "/map", icon: MapPin },
  { label: "Department AI", href: "/ai-assistant", icon: BrainCircuit },
  { label: "Analytics & Trends", href: "/analytics", icon: BarChart3 },
  { label: "System Audit Logs", href: "/logs", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-[#0b132b] border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-[#0e1735]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              CRMS POLICE
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">State Dept Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Enterprise Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-800 bg-[#070d19]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 border border-slate-600">
            {user?.full_name?.charAt(0) || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name || "Police Officer"}</p>
            <p className="text-[10px] text-cyan-400/80 font-mono truncate">{user?.role?.name || "Officer"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
