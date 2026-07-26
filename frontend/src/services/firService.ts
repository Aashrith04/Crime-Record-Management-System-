import { api } from "./api";
import { FIR, PaginatedApiResponse, StandardApiResponse } from "@/types";

export const firService = {
  getFIRs: async (params?: { search?: string; status?: string; is_deleted?: boolean; page?: number; page_size?: number }): Promise<PaginatedApiResponse<FIR>> => {
    const res = await api.get("/firs", { params });
    return res.data;
  },

  getFIRById: async (publicId: string): Promise<StandardApiResponse<FIR>> => {
    const res = await api.get(`/firs/${publicId}`);
    return res.data;
  },

  createFIR: async (firData: Partial<FIR>): Promise<StandardApiResponse<FIR>> => {
    const res = await api.post("/firs", firData);
    return res.data;
  },

  updateFIR: async (publicId: string, firData: Partial<FIR>): Promise<StandardApiResponse<FIR>> => {
    const res = await api.put(`/firs/${publicId}`, firData);
    return res.data;
  },

  downloadPDF: async (publicId: string, firNumber: string): Promise<void> => {
    const res = await api.get(`/firs/${publicId}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${firNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  deleteFIR: async (publicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.delete(`/firs/${publicId}`);
    return res.data;
  },

  restoreFIR: async (publicId: string): Promise<StandardApiResponse<FIR>> => {
    const res = await api.post(`/firs/${publicId}/restore`);
    return res.data;
  }
};
