import { api } from "./api";
import { OfficerWorkload, User, PaginatedApiResponse, StandardApiResponse } from "@/types";

export const officerService = {
  getOfficers: async (params?: { station_name?: string; search?: string; page?: number; page_size?: number }): Promise<PaginatedApiResponse<OfficerWorkload>> => {
    const res = await api.get("/officers", { params });
    return res.data;
  },

  getOfficerById: async (publicId: string): Promise<StandardApiResponse<OfficerWorkload>> => {
    const res = await api.get(`/officers/${publicId}`);
    return res.data;
  },

  updateOfficerProfile: async (publicId: string, data: Partial<User>): Promise<StandardApiResponse<User>> => {
    const res = await api.put(`/officers/${publicId}`, data);
    return res.data;
  }
};
