from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

# Base AI Meta Response
class AIConfidenceMeta(BaseModel):
    confidence_percentage: float = 95.0
    confidence_category: str = "High" # High, Medium, Low
    evidence_count: int = 0
    provider: str = "baseline"
    processing_time_ms: float = 0.0
    reliability_score: float = 0.95

class AIExplainabilityMeta(BaseModel):
    reasoning_summary: str
    supporting_evidence: List[str] = []
    related_records: List[Dict[str, Any]] = []
    explanation: str

# Assistant Chat
class AIChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="User investigation query")
    conversation_id: Optional[str] = None

class AIChatResponseData(BaseModel):
    conversation_id: str
    answer: str
    referenced_records: List[Dict[str, Any]] = []
    suggested_followups: List[str] = []
    confidence: AIConfidenceMeta
    explainability: AIExplainabilityMeta

# FIR Summarization
class FIRSummarizeRequest(BaseModel):
    fir_number: str

class FIRSummaryResponseData(BaseModel):
    fir_number: str
    short_summary: str
    detailed_summary: str
    chronological_timeline: List[Dict[str, Any]] = []
    extracted_ipc_sections: List[str] = []
    key_individuals: List[str] = []
    locations: List[str] = []
    important_dates: List[str] = []
    evidence_references: List[str] = []
    confidence: AIConfidenceMeta

# OCR Processing
class OCRProcessRequest(BaseModel):
    document_name: str
    document_type: str = "FIR" # FIR, Evidence, Witness Statement, Charge Sheet
    text_content: Optional[str] = None

class OCRProcessResponseData(BaseModel):
    document_name: str
    document_type: str
    raw_text: str
    extracted_metadata: Dict[str, Any]
    confidence: AIConfidenceMeta

# Semantic Search & Recommendations
class AISearchQuery(BaseModel):
    query: str
    target: Optional[str] = "all" # all, crimes, firs, criminals, evidence
    page: int = 1
    page_size: int = 10

class AISearchResultItem(BaseModel):
    similarity_score: float
    entity_type: str
    title: str
    description: str
    public_id: str
    matched_fields: List[str] = []
    detail_url: str

class AISearchResponseData(BaseModel):
    query: str
    results: List[AISearchResultItem]
    total: int
    confidence: AIConfidenceMeta

class CaseRecommendationQuery(BaseModel):
    crime_public_id: str

class SimilarCaseItem(BaseModel):
    similarity_score: float
    crime_number: str
    title: str
    matching_reasons: List[str]
    supporting_evidence: List[str]
    detail_url: str

class CaseRecommendationResponseData(BaseModel):
    source_crime: str
    recommendations: List[SimilarCaseItem]
    confidence: AIConfidenceMeta

# AI Dashboard Overview
class AIDashboardStats(BaseModel):
    total_ai_queries: int
    total_fir_summaries: int
    total_ocr_documents: int
    avg_confidence_score: float
    avg_latency_ms: float
    active_provider: str
    recent_activities: List[Dict[str, Any]] = []
    pending_tasks: List[Dict[str, Any]] = []
