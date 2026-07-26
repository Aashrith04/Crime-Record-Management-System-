from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserRead

class EvidenceChainOfCustodyCreate(BaseModel):
    action: str = Field(..., max_length=100) # Checked In, Checked Out, Transferred to Lab, Presented in Court, Returned
    moved_from: Optional[str] = None
    moved_to: Optional[str] = None
    notes: Optional[str] = None

class EvidenceChainOfCustodyRead(EvidenceChainOfCustodyCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    created_at: datetime
    handled_by: Optional[UserRead] = None

class EvidenceBase(BaseModel):
    crime_id: int
    file_name: str = Field(..., max_length=255)
    file_type: str = Field(..., max_length=50) # image, video, audio, pdf, document
    file_url: str
    public_id: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    storage_location: str = "Central Vault Locker A-1"
    status: str = "In Locker"
    assigned_officer_id: Optional[int] = None

class EvidenceCreate(EvidenceBase):
    pass

class EvidenceUpdate(BaseModel):
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    storage_location: Optional[str] = None
    status: Optional[str] = None
    assigned_officer_id: Optional[int] = None

class EvidenceRead(EvidenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    evidence_number: str
    created_at: datetime
    updated_at: datetime
    uploaded_by: Optional[UserRead] = None
    assigned_officer: Optional[UserRead] = None
    chain_of_custody: List[EvidenceChainOfCustodyRead] = []
