from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict

class SearchQuery(BaseModel):
    query: str
    category: Optional[str] = "all" # all, crimes, firs, criminals, victims, witnesses, evidence, officers
    status: Optional[str] = None
    crime_type: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    page_size: int = 10
    sort_by: str = "created_at"
    sort_order: str = "desc"

class SearchResultItem(BaseModel):
    entity_type: str # Crime, FIR, Criminal, Victim, Witness, Evidence, Officer
    title: str
    subtitle: str
    public_id: str
    detail_url: str
    badge_text: str
    badge_color: str
    created_at: str
    metadata: Optional[dict] = None

class GlobalSearchResponseData(BaseModel):
    items: List[SearchResultItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    suggestions: List[str] = []
