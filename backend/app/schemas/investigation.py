from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserRead

class CaseDiaryCreate(BaseModel):
    notes: str
    entry_date: Optional[datetime] = None

class CaseDiaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    notes: str
    entry_date: datetime
    author: Optional[UserRead] = None

class InvestigationBase(BaseModel):
    crime_id: int
    lead_investigator_id: Optional[int] = None
    status: str = Field(default="In Progress") # In Progress, Pending Chargesheet, Closed, Cold Case
    summary: Optional[str] = None
    started_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class InvestigationCreate(InvestigationBase):
    pass

class InvestigationUpdate(BaseModel):
    lead_investigator_id: Optional[int] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    closed_at: Optional[datetime] = None

class InvestigationRead(InvestigationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    created_at: datetime
    updated_at: datetime
    lead_investigator: Optional[UserRead] = None
    case_diaries: List[CaseDiaryRead] = []
