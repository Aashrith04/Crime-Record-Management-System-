import { api } from "./api";
import { Crime, PaginatedApiResponse, StandardApiResponse } from "@/types";

export interface CrimeFilterParams {
  search?: string;
  crime_type?: string;
  status?: string;
  priority?: string;
  severity?: string;
  is_deleted?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export const crimeService = {
  getCrimes: async (params?: CrimeFilterParams): Promise<PaginatedApiResponse<Crime>> => {
    const res = await api.get("/crimes", { params });
    return res.data;
  },

  getCrimeById: async (publicId: string): Promise<StandardApiResponse<Crime>> => {
    const res = await api.get(`/crimes/${publicId}`);
    return res.data;
  },

  createCrime: async (crimeData: Partial<Crime>): Promise<StandardApiResponse<Crime>> => {
    const res = await api.post("/crimes", crimeData);
    return res.data;
  },

  updateCrime: async (publicId: string, crimeData: Partial<Crime>): Promise<StandardApiResponse<Crime>> => {
    const res = await api.put(`/crimes/${publicId}`, crimeData);
    return res.data;
  },

  updateStatus: async (publicId: string, status: string): Promise<StandardApiResponse<Crime>> => {
    const res = await api.patch(`/crimes/${publicId}/status`, { status });
    return res.data;
  },

  updatePriority: async (publicId: string, priority: string): Promise<StandardApiResponse<Crime>> => {
    const res = await api.patch(`/crimes/${publicId}/priority`, { priority });
    return res.data;
  },

  updateSeverity: async (publicId: string, severity: string): Promise<StandardApiResponse<Crime>> => {
    const res = await api.patch(`/crimes/${publicId}/severity`, { severity });
    return res.data;
  },

  assignOfficer: async (publicId: string, assigned_officer_id: number): Promise<StandardApiResponse<Crime>> => {
    const res = await api.post(`/crimes/${publicId}/assign`, { assigned_officer_id });
    return res.data;
  },

  addTimelineEntry: async (publicId: string, entry: { title: string; description: string }): Promise<StandardApiResponse<any>> => {
    const res = await api.post(`/crimes/${publicId}/timeline`, entry);
    return res.data;
  },

  deleteCrime: async (publicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.delete(`/crimes/${publicId}`);
    return res.data;
  },

  restoreCrime: async (publicId: string): Promise<StandardApiResponse<Crime>> => {
    const res = await api.post(`/crimes/${publicId}/restore`);
    return res.data;
  }
};
