"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "@/services/api";

const createCustomIcon = (color: string) => L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 12px ${color}; cursor: pointer;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const criticalIcon = createCustomIcon("#f43f5e"); // Rose Red
const severeIcon = createCustomIcon("#f59e0b"); // Amber
const defaultIcon = createCustomIcon("#06b6d4"); // Cyan

export default function CrimeMapComponent() {
  const [crimeTypeFilter, setCrimeTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const { data: geoData, isLoading } = useQuery({
    queryKey: ["map-crimes", crimeTypeFilter, severityFilter],
    queryFn: async () => {
      const res = await api.get("/map/crimes", {
        params: {
          crime_type: crimeTypeFilter || undefined,
          severity: severityFilter || undefined
        }
      });
      return res.data?.data;
    }
  });

  const features = geoData?.features || [];

  return (
    <div className="space-y-4">
      {/* Map Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1c2541]/40 p-3 rounded-lg border border-slate-800 text-xs">
        <div className="flex gap-2">
          <select
            value={crimeTypeFilter}
            onChange={(e) => setCrimeTypeFilter(e.target.value)}
            className="bg-[#0b132b] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Offense Types</option>
            <option value="Robbery">Robbery</option>
            <option value="Cybercrime">Cybercrime</option>
            <option value="Assault">Assault</option>
            <option value="Theft">Theft</option>
            <option value="Homicide">Homicide</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0b132b] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="Minor">Minor</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Severe</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span> Standard</span>
          <span className="ml-2 font-bold">Active Markers: {features.length}</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-800 relative shadow-2xl">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-[#0b132b] text-cyan-400 text-xs font-mono">
            Fetching GIS spatial coordinates...
          </div>
        ) : (
          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {features.map((f: any) => {
              const coords = f.geometry.coordinates; // [lng, lat]
              const prop = f.properties;
              const icon = prop.severity === "Critical" ? criticalIcon : (prop.severity === "Severe" ? severeIcon : defaultIcon);

              return (
                <Marker
                  key={prop.id}
                  position={[coords[1], coords[0]]}
                  icon={icon}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <p className="font-bold text-slate-900">{prop.title}</p>
                      <p className="text-cyan-700 font-mono font-semibold">{prop.crime_number}</p>
                      <p className="text-slate-600">Type: {prop.crime_type}</p>
                      <p className="text-slate-600">Location: {prop.location_name}</p>
                      <p className="font-bold text-slate-800">
                        Severity: {prop.severity} • Status: {prop.status}
                      </p>
                      <a
                        href={`/crimes/${prop.public_id}`}
                        className="inline-block mt-1 px-2 py-0.5 bg-cyan-600 text-white rounded text-[10px] font-medium hover:bg-cyan-500"
                      >
                        View Crime Record →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
