import { api } from "./api";

export const exportService = {
  exportTable: async (entity: string, format: "csv" | "excel" | "pdf", status?: string): Promise<void> => {
    const res = await api.get(`/export/${entity}`, {
      params: { format, status },
      responseType: "blob"
    });

    const ext = format === "csv" ? "csv" : format === "excel" ? "xls" : "pdf";
    const mime = format === "pdf" ? "application/pdf" : format === "csv" ? "text/csv" : "application/vnd.ms-excel";

    const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${entity}_export.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadReportPDF: async (reportType: string, publicId?: string): Promise<void> => {
    const res = await api.get(`/reports/pdf/${reportType}`, {
      params: { public_id: publicId },
      responseType: "blob"
    });

    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${reportType}_Official_Report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
