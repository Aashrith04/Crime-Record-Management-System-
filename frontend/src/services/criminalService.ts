import { api } from "./api";
import { Criminal, PaginatedApiResponse, StandardApiResponse } from "@/types";

export const criminalService = {
  getCriminals: async (params?: { search?: string; wanted_status?: string; is_deleted?: boolean; page?: number; page_size?: number }): Promise<PaginatedApiResponse<Criminal>> => {
    const res = await api.get("/criminals", { params });
    return res.data;
  },

  getCriminalById: async (publicId: string): Promise<StandardApiResponse<Criminal>> => {
    const res = await api.get(`/criminals/${publicId}`);
    return res.data;
  },

  createCriminal: async (criminalData: Partial<Criminal>): Promise<StandardApiResponse<Criminal>> => {
    const res = await api.post("/criminals", criminalData);
    return res.data;
  },

  updateCriminal: async (publicId: string, criminalData: Partial<Criminal>): Promise<StandardApiResponse<Criminal>> => {
    const res = await api.put(`/criminals/${publicId}`, criminalData);
    return res.data;
  },

  linkToCrime: async (publicId: string, crimeId: number, roleInCrime: string): Promise<StandardApiResponse<Criminal>> => {
    const res = await api.post(`/criminals/${publicId}/link-crime`, { crime_id: crimeId, role_in_crime: roleInCrime });
    return res.data;
  },

  deleteCriminal: async (publicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.delete(`/criminals/${publicId}`);
    return res.data;
  },

  restoreCriminal: async (publicId: string): Promise<StandardApiResponse<Criminal>> => {
    const res = await api.post(`/criminals/${publicId}/restore`);
    return res.data;
  }
};
