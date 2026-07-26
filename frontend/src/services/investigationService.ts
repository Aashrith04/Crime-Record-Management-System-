import { api } from "./api";
import { CaseDiary, Investigation, PaginatedApiResponse, StandardApiResponse } from "@/types";

export const investigationService = {
  getInvestigations: async (params?: { status?: string; is_deleted?: boolean; page?: number }): Promise<PaginatedApiResponse<Investigation>> => {
    const res = await api.get("/investigations", { params });
    return res.data;
  },

  getInvestigationById: async (publicId: string): Promise<StandardApiResponse<Investigation>> => {
    const res = await api.get(`/investigations/${publicId}`);
    return res.data;
  },

  createInvestigation: async (data: Partial<Investigation>): Promise<StandardApiResponse<Investigation>> => {
    const res = await api.post("/investigations", data);
    return res.data;
  },

  updateInvestigation: async (publicId: string, data: Partial<Investigation>): Promise<StandardApiResponse<Investigation>> => {
    const res = await api.put(`/investigations/${publicId}`, data);
    return res.data;
  },

  addCaseDiaryEntry: async (publicId: string, notes: string): Promise<StandardApiResponse<CaseDiary>> => {
    const res = await api.post(`/investigations/${publicId}/case-diaries`, { notes });
    return res.data;
  },

  deleteInvestigation: async (publicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.delete(`/investigations/${publicId}`);
    return res.data;
  },

  restoreInvestigation: async (publicId: string): Promise<StandardApiResponse<Investigation>> => {
    const res = await api.post(`/investigations/${publicId}/restore`);
    return res.data;
  }
};
