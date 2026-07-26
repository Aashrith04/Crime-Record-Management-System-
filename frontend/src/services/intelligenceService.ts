import { api } from "./api";
import { StandardApiResponse } from "@/types";

export interface DuplicateMatch {
  public_id: string;
  canonical_name: string;
  record_a: Record<string, any>;
  record_b: Record<string, any>;
  confidence_score: number;
  duplicate_probability: number;
  matching_factors: Record<string, any>[];
  reasoning: string;
}

export interface IntelligenceOverviewData {
  total_entities_resolved: number;
  potential_duplicates_count: number;
  cross_case_links_count: number;
  active_alerts_count: number;
  duplicates: DuplicateMatch[];
}

export interface EntityResolutionRead {
  public_id: string;
  entity_type: string;
  canonical_name: string;
  confidence: number;
  source_records: Record<string, any>[];
  metadata: Record<string, any>;
  status: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  group: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  confidence?: number;
  strength?: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface CrossCaseLinkRead {
  id: number;
  crime_a_public_id: string;
  crime_a_title: string;
  crime_b_public_id: string;
  crime_b_title: string;
  match_score: number;
  risk_score: number;
  confidence_percentage: number;
  matching_reason: string;
  matching_entities: string[];
  status: string;
  created_at: string;
}

export interface IntelligenceAlertRead {
  id: number;
  alert_type: string;
  priority: string;
  crime_public_id?: string;
  description: string;
  confidence: number;
  status: string;
  created_at: string;
}

export interface OfficerMetricRead {
  officer_public_id: string;
  officer_name: string;
  workload: number;
  efficiency: number;
  active_cases: number;
  closure_rate: number;
  risk_level: string;
  recommendation: string;
}

export const intelligenceService = {
  getOverview: async (): Promise<StandardApiResponse<IntelligenceOverviewData>> => {
    const res = await api.get("/intelligence/overview");
    return res.data;
  },

  getEntities: async (): Promise<StandardApiResponse<EntityResolutionRead[]>> => {
    const res = await api.get("/intelligence/entities");
    return res.data;
  },

  getEntityById: async (publicId: string): Promise<StandardApiResponse<EntityResolutionRead>> => {
    const res = await api.get(`/intelligence/entities/${publicId}`);
    return res.data;
  },

  getDuplicates: async (): Promise<StandardApiResponse<DuplicateMatch[]>> => {
    const res = await api.get("/intelligence/duplicates");
    return res.data;
  },

  mergeEntities: async (sourcePublicId: string, targetPublicId: string, reason: string): Promise<StandardApiResponse<EntityResolutionRead>> => {
    const res = await api.post("/intelligence/merge", {
      source_public_id: sourcePublicId,
      target_public_id: targetPublicId,
      reason: reason
    });
    return res.data;
  },

  getCriminalNetwork: async (criminalPublicId: string): Promise<StandardApiResponse<KnowledgeGraphData>> => {
    const res = await api.get(`/intelligence/network/${criminalPublicId}`);
    return res.data;
  },

  getCrossCaseLinks: async (crimePublicId?: string): Promise<StandardApiResponse<CrossCaseLinkRead[]>> => {
    const res = await api.get("/intelligence/cross-case", { params: { crime_public_id: crimePublicId } });
    return res.data;
  },

  submitCrossCaseFeedback: async (crossCaseLinkId: number, feedback: "Confirmed" | "False Positive", notes?: string): Promise<StandardApiResponse<any>> => {
    const res = await api.post("/intelligence/cross-case/feedback", {
      cross_case_link_id: crossCaseLinkId,
      feedback,
      notes
    });
    return res.data;
  },

  getKnowledgeGraph: async (): Promise<StandardApiResponse<KnowledgeGraphData>> => {
    const res = await api.get("/intelligence/graph");
    return res.data;
  },

  getShortestPath: async (startEntityId: string, endEntityId: string): Promise<StandardApiResponse<any>> => {
    const res = await api.get("/intelligence/graph/shortest-path", {
      params: { start_entity_id: startEntityId, end_entity_id: endEntityId }
    });
    return res.data;
  },

  getAlerts: async (): Promise<StandardApiResponse<IntelligenceAlertRead[]>> => {
    const res = await api.get("/intelligence/alerts");
    return res.data;
  },

  acknowledgeAlert: async (alertId: number, status: string = "Acknowledged"): Promise<StandardApiResponse<IntelligenceAlertRead>> => {
    const res = await api.post("/intelligence/alerts/acknowledge", { alert_id: alertId, status });
    return res.data;
  },

  getOfficerMetrics: async (): Promise<StandardApiResponse<OfficerMetricRead[]>> => {
    const res = await api.get("/intelligence/officers");
    return res.data;
  },

  unifiedSearch: async (query: string, category: string = "all"): Promise<StandardApiResponse<any>> => {
    const res = await api.post("/intelligence/unified-search", { query, category });
    return res.data;
  }
};
