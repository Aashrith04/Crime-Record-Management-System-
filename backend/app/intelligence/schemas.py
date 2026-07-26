from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class EntityMatchFactor(BaseModel):
    field_name: str
    match_type: str # Exact, Fuzzy, Phone, Address, Alias
    value_a: str
    value_b: str
    weight: float

class DuplicateMatch(BaseModel):
    public_id: str
    canonical_name: str
    record_a: Dict[str, Any]
    record_b: Dict[str, Any]
    confidence_score: float
    duplicate_probability: float
    matching_factors: List[EntityMatchFactor]
    reasoning: str

class ResolveEntityRequest(BaseModel):
    record_ids: List[str]
    entity_type: str = "Criminal"

class MergeEntityRequest(BaseModel):
    source_public_id: str
    target_public_id: str
    reason: str

class EntityResolutionRead(BaseModel):
    public_id: str
    entity_type: str
    canonical_name: str
    confidence: float
    source_records: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    status: str
    created_at: str

# Module 2 & 4: Knowledge Graph & Criminal Intelligence Network
class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    group: str
    metadata: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str
    confidence: float = 90.0
    strength: float = 1.0

class KnowledgeGraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int

# Module 3: Cross Case Intelligence Engine
class CrossCaseLinkRead(BaseModel):
    id: int
    crime_a_public_id: str
    crime_a_title: str
    crime_b_public_id: str
    crime_b_title: str
    match_score: float
    risk_score: float
    confidence_percentage: float
    matching_reason: str
    matching_entities: List[str]
    status: str
    created_at: str

class CrossCaseFeedbackRequest(BaseModel):
    cross_case_link_id: int
    feedback: str # Confirmed, False Positive
    notes: Optional[str] = None

class ShortestPathQuery(BaseModel):
    start_entity_id: str
    end_entity_id: str

class ShortestPathResponse(BaseModel):
    path_nodes: List[GraphNode]
    path_edges: List[GraphEdge]
    total_hops: int
    connection_explanation: str

# Module 5: Investigation Intelligence
class InvestigationScoreRead(BaseModel):
    crime_public_id: str
    crime_title: str
    completion_score: float
    missing_items: List[str]
    risk_score: float
    recommendations: List[str]
    created_at: str

# Module 6: Officer Intelligence
class OfficerMetricRead(BaseModel):
    officer_public_id: str
    officer_name: str
    workload: int
    efficiency: float
    active_cases: int
    closure_rate: float
    risk_level: str
    recommendation: str

# Module 7: Timeline Intelligence
class TimelineAnalysisRead(BaseModel):
    crime_public_id: str
    delay_score: float
    anomalies: List[str]
    predictions: List[str]
    timeline_summary: str

# Module 8: Predictive Investigation Alerts
class IntelligenceAlertRead(BaseModel):
    id: int
    alert_type: str
    priority: str
    crime_public_id: Optional[str] = None
    description: str
    confidence: float
    status: str
    created_at: str

class AlertAcknowledgeRequest(BaseModel):
    alert_id: int
    status: str = "Acknowledged"

# Unified Intelligence Search
class UnifiedSearchQuery(BaseModel):
    query: str
    category: Optional[str] = "all"

class UnifiedSearchResult(BaseModel):
    type: str
    title: str
    description: str
    public_id: str
    url: str
    confidence: float

class IntelligenceOverviewData(BaseModel):
    total_entities_resolved: int
    potential_duplicates_count: int
    cross_case_links_count: int
    active_alerts_count: int
    duplicates: List[DuplicateMatch] = []
