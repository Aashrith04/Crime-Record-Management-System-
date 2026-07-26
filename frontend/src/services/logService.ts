import { api } from "./api";
import { AuditLog, PaginatedApiResponse } from "@/types";

export const logService = {
  getLogs: async (params?: { action?: string; entity_type?: string; search?: string; page?: number }): Promise<PaginatedApiResponse<AuditLog>> => {
    const res = await api.get("/logs", { params });
    return res.data;
  }
};
