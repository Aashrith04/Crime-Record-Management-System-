"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Shield, Layers } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import of Leaflet map container to prevent SSR window reference error
const CrimeMapComponent = dynamic(
  () => import("@/components/map/CrimeMapComponent"),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center bg-[#0b132b] text-cyan-400 text-xs">Loading GIS Map Layer...</div> }
);

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <span>Department GIS Crime Heatmap & Hotspots</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Spatial intelligence map displaying crime coordinates, police station zones, and high-risk hotspots.</p>
      </div>

      <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 shadow-xl">
        <CrimeMapComponent />
      </div>
    </div>
  );
}
