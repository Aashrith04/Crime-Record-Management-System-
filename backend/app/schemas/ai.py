from typing import List, Optional
from pydantic import BaseModel

class NaturalLanguageSearchQuery(BaseModel):
    query: str

class FIRSummaryRequest(BaseModel):
    fir_number: str

class FIRSummaryResponse(BaseModel):
    fir_number: str
    key_incident_summary: str
    applicable_sections: List[str]
    risk_level: str
    suggested_action_plan: List[str]

class SeverityPredictionRequest(BaseModel):
    crime_type: str
    description: str
    location_name: str

class SeverityPredictionResponse(BaseModel):
    predicted_severity: str # Minor, Moderate, Severe, Critical
    confidence_score: float # e.g. 0.94
    risk_factors: List[str]
    priority_level: str

class RepeatOffenderMatch(BaseModel):
    criminal_public_id: str
    full_name: str
    alias: Optional[str] = None
    similarity_score: float
    past_crimes_count: int
    matching_patterns: List[str]
