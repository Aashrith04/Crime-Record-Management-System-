import { api } from "./api";
import { StandardApiResponse } from "@/types";

export interface DepartmentSettingsData {
  crime_categories: string[];
  evidence_categories: string[];
  ranks: string[];
  police_stations: string[];
  storage_locations: string[];
  case_priorities: string[];
  theme: string;
}

export const settingsService = {
  getSettings: async (): Promise<StandardApiResponse<DepartmentSettingsData>> => {
    const res = await api.get("/settings");
    return res.data;
  },

  updateSettings: async (settingsData: DepartmentSettingsData): Promise<StandardApiResponse<DepartmentSettingsData>> => {
    const res = await api.put("/settings", settingsData);
    return res.data;
  },
};
