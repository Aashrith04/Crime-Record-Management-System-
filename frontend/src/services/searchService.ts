import { api } from "./api";
import { StandardApiResponse } from "@/types";

export interface SearchResultItem {
  entity_type: string;
  title: string;
  subtitle: string;
  public_id: string;
  detail_url: string;
  badge_text: string;
  badge_color: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface GlobalSearchResponseData {
  items: SearchResultItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  suggestions: string[];
}

export const searchService = {
  globalSearch: async (params: {
    q: string;
    category?: string;
    status?: string;
    crime_type?: string;
    page?: number;
  }): Promise<StandardApiResponse<GlobalSearchResponseData>> => {
    const res = await api.get("/search", { params });
    return res.data;
  },
};
