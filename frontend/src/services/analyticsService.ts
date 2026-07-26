import { api } from "./api";
import { AnalyticsOverview, StandardApiResponse } from "@/types";

export const analyticsService = {
  getOverview: async (): Promise<StandardApiResponse<AnalyticsOverview>> => {
    const res = await api.get("/analytics/overview");
    return res.data;
  },

  downloadAnalyticsPDF: async (): Promise<void> => {
    const res = await api.get("/analytics/export-pdf", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Police_Department_Analytics_Report.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
