import { api } from "./api";
import { Evidence, PaginatedApiResponse, StandardApiResponse } from "@/types";

export const evidenceService = {
  getEvidences: async (params?: { crime_id?: number; file_type?: string; status?: string; search?: string; is_deleted?: boolean; page?: number }): Promise<PaginatedApiResponse<Evidence>> => {
    const res = await api.get("/evidences", { params });
    return res.data;
  },

  getEvidenceById: async (publicId: string): Promise<StandardApiResponse<Evidence>> => {
    const res = await api.get(`/evidences/${publicId}`);
    return res.data;
  },

  uploadEvidence: async (evidenceData: Partial<Evidence>): Promise<StandardApiResponse<Evidence>> => {
    const res = await api.post("/evidences", evidenceData);
    return res.data;
  },

  uploadEvidenceFile: async (formData: FormData): Promise<StandardApiResponse<Evidence>> => {
    const res = await api.post("/evidences/upload-file", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  },

  updateEvidence: async (publicId: string, evidenceData: Partial<Evidence>): Promise<StandardApiResponse<Evidence>> => {
    const res = await api.put(`/evidences/${publicId}`, evidenceData);
    return res.data;
  },

  moveCustody: async (publicId: string, custodyData: { action: string; moved_from?: string; moved_to?: string; notes?: string }): Promise<StandardApiResponse<Evidence>> => {
    const res = await api.post(`/evidences/${publicId}/custody-move`, custodyData);
    return res.data;
  },

  deleteEvidence: async (publicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.delete(`/evidences/${publicId}`);
    return res.data;
  },

  restoreEvidence: async (publicId: string): Promise<StandardApiResponse<Evidence>> => {
    const res = await api.post(`/evidences/${publicId}/restore`);
    return res.data;
  }
};
