from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserRead

class CrimeFilter(BaseModel):
    search: Optional[str] = None
    crime_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    station_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_deleted: Optional[bool] = False
    page: int = 1
    page_size: int = 10
    sort_by: str = "created_at"
    sort_order: str = "desc"

class CrimeBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    crime_type: str = Field(..., max_length=100)
    custom_crime_type: Optional[str] = None
    description: str
    crime_date: datetime
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: str = Field(default="Medium") # Low, Medium, High, Critical
    severity: str = Field(default="Moderate") # Minor, Moderate, Severe, Critical
    status: str = Field(default="Open") # Open, Under Investigation, Pending Approval, Closed

class CrimeCreate(CrimeBase):
    assigned_officer_id: Optional[int] = None

class CrimeUpdate(BaseModel):
    title: Optional[str] = None
    crime_type: Optional[str] = None
    custom_crime_type: Optional[str] = None
    description: Optional[str] = None
    crime_date: Optional[datetime] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_officer_id: Optional[int] = None

class CrimeStatusUpdate(BaseModel):
    status: str

class CrimePriorityUpdate(BaseModel):
    priority: str

class CrimeSeverityUpdate(BaseModel):
    severity: str

class CrimeAssignUpdate(BaseModel):
    assigned_officer_id: int

class CrimeTimelineCreate(BaseModel):
    title: str
    description: str
    event_timestamp: Optional[datetime] = None

class CrimeTimelineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    title: str
    description: str
    event_timestamp: datetime
    performed_by: Optional[UserRead] = None

class CrimeRead(CrimeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    crime_number: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    assigned_officer: Optional[UserRead] = None
    timeline_entries: List[CrimeTimelineRead] = []
