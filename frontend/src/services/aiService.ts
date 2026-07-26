import { api } from "./api";
import { StandardApiResponse } from "@/types";

export interface AIConfidenceMeta {
  confidence_percentage: number;
  confidence_category: string;
  evidence_count: number;
  provider: string;
  processing_time_ms: number;
  reliability_score: number;
}

export interface AIExplainabilityMeta {
  reasoning_summary: string;
  supporting_evidence: string[];
  related_records: Record<string, any>[];
  explanation: string;
}

export interface AIChatResponseData {
  conversation_id: string;
  answer: string;
  referenced_records: Record<string, any>[];
  suggested_followups: string[];
  confidence: AIConfidenceMeta;
  explainability: AIExplainabilityMeta;
}

export interface FIRSummaryResponseData {
  fir_number: string;
  short_summary: string;
  detailed_summary: string;
  chronological_timeline: Record<string, any>[];
  extracted_ipc_sections: string[];
  key_individuals: string[];
  locations: string[];
  important_dates: string[];
  evidence_references: string[];
  confidence: AIConfidenceMeta;
}

export interface OCRProcessResponseData {
  document_name: string;
  document_type: string;
  raw_text: string;
  extracted_metadata: Record<string, any>;
  confidence: AIConfidenceMeta;
}

export interface AIDashboardStats {
  total_ai_queries: number;
  total_fir_summaries: number;
  total_ocr_documents: number;
  avg_confidence_score: number;
  avg_latency_ms: number;
  active_provider: string;
  recent_activities: Record<string, any>[];
  pending_tasks: Record<string, any>[];
}

export const aiService = {
  chatAssistant: async (prompt: string, conversationId?: string): Promise<StandardApiResponse<AIChatResponseData>> => {
    const res = await api.post("/ai/chat", { prompt, conversation_id: conversationId });
    return res.data;
  },

  summarizeFIR: async (firNumber: string): Promise<StandardApiResponse<FIRSummaryResponseData>> => {
    const res = await api.post("/ai/summarize-fir", { fir_number: firNumber });
    return res.data;
  },

  processOCR: async (documentName: string, documentType: string = "FIR", textContent?: string): Promise<StandardApiResponse<OCRProcessResponseData>> => {
    const res = await api.post("/ai/ocr", { document_name: documentName, document_type: documentType, text_content: textContent });
    return res.data;
  },

  semanticSearch: async (query: string, target: string = "all"): Promise<StandardApiResponse<any>> => {
    const res = await api.post("/ai/semantic-search", { query, target });
    return res.data;
  },

  getSimilarCases: async (crimePublicId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.get(`/ai/recommendations/${crimePublicId}`);
    return res.data;
  },

  getHotspots: async (): Promise<StandardApiResponse<any>> => {
    const res = await api.get("/ai/hotspots");
    return res.data;
  },

  getDashboardStats: async (): Promise<StandardApiResponse<AIDashboardStats>> => {
    const res = await api.get("/ai/dashboard-stats");
    return res.data;
  },

  getConfig: async (): Promise<StandardApiResponse<any>> => {
    const res = await api.get("/ai/config");
    return res.data;
  }
};
