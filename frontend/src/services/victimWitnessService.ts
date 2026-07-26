import { api } from "./api";
import { Victim, Witness, PaginatedApiResponse, StandardApiResponse } from "@/types";

export const victimWitnessService = {
  getVictims: async (params?: { crime_id?: number; search?: string; is_deleted?: boolean; page?: number }): Promise<PaginatedApiResponse<Victim>> => {
    const res = await api.get("/victims-witnesses/victims", { params });
    return res.data;
  },

  createVictim: async (victimData: Partial<Victim>): Promise<StandardApiResponse<Victim>> => {
    const res = await api.post("/victims-witnesses/victims", victimData);
    return res.data;
  },

  updateVictim: async (publicId: string, victimData: Partial<Victim>): Promise<StandardApiResponse<Victim>> => {
    const res = await api.put(`/victims-witnesses/victims/${publicId}`, victimData);
    return res.data;
  },

  deleteVictim: async (publicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.delete(`/victims-witnesses/victims/${publicId}`);
    return res.data;
  },

  restoreVictim: async (publicId: string): Promise<StandardApiResponse<Victim>> => {
    const res = await api.post(`/victims-witnesses/victims/${publicId}/restore`);
    return res.data;
  },

  getWitnesses: async (params?: { crime_id?: number; search?: string; is_deleted?: boolean; page?: number }): Promise<PaginatedApiResponse<Witness>> => {
    const res = await api.get("/victims-witnesses/witnesses", { params });
    return res.data;
  },

  createWitness: async (witnessData: Partial<Witness>): Promise<StandardApiResponse<Witness>> => {
    const res = await api.post("/victims-witnesses/witnesses", witnessData);
    return res.data;
  },

  updateWitness: async (publicId: string, witnessData: Partial<Witness>): Promise<StandardApiResponse<Witness>> => {
    const res = await api.put(`/victims-witnesses/witnesses/${publicId}`, witnessData);
    return res.data;
  },

  deleteWitness: async (publicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.delete(`/victims-witnesses/witnesses/${publicId}`);
    return res.data;
  },

  restoreWitness: async (publicId: string): Promise<StandardApiResponse<Witness>> => {
    const res = await api.post(`/victims-witnesses/witnesses/${publicId}/restore`);
    return res.data;
  }
};
