"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileCode } from "lucide-react";
import { exportService } from "@/services/exportService";
import { useToast } from "@/components/ui/Toast";

interface ExportButtonsProps {
  entity: "crimes" | "firs" | "criminals" | "evidences" | "officers" | "investigations";
  status?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ entity, status }) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      setIsExporting(true);
      await exportService.exportTable(entity, format, status);
      showToast(`Exported ${entity} dataset to ${format.toUpperCase()}.`, "success");
    } catch (err: any) {
      showToast("Export failed: " + (err.message || "Server error"), "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-[#1c2541]/40 border border-slate-700/80 rounded-lg p-1">
      <span className="text-[10px] font-mono text-slate-400 px-2 uppercase font-bold flex items-center gap-1">
        <Download className="w-3 h-3 text-cyan-400" />
        <span>Export:</span>
      </span>

      <button
        onClick={() => handleExport("csv")}
        disabled={isExporting}
        className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 transition flex items-center gap-1"
        title="Export to CSV Spreadsheet"
      >
        <FileSpreadsheet className="w-3 h-3" />
        <span>CSV</span>
      </button>

      <button
        onClick={() => handleExport("excel")}
        disabled={isExporting}
        className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 transition flex items-center gap-1"
        title="Export to Excel Spreadsheet"
      >
        <FileCode className="w-3 h-3" />
        <span>Excel</span>
      </button>

      <button
        onClick={() => handleExport("pdf")}
        disabled={isExporting}
        className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 transition flex items-center gap-1"
        title="Export to Official PDF Document"
      >
        <FileText className="w-3 h-3" />
        <span>PDF</span>
      </button>
    </div>
  );
};
