from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class FIRBase(BaseModel):
    crime_id: int
    complainant_name: str = Field(..., min_length=2, max_length=255)
    complainant_contact: str = Field(..., max_length=100)
    complainant_address: Optional[str] = None
    incident_details: str
    sections_of_law: str = Field(..., max_length=255)
    status: str = Field(default="Registered")

class FIRCreate(FIRBase):
    pass

class FIRUpdate(BaseModel):
    complainant_name: Optional[str] = None
    complainant_contact: Optional[str] = None
    complainant_address: Optional[str] = None
    incident_details: Optional[str] = None
    sections_of_law: Optional[str] = None
    status: Optional[str] = None

class FIRRead(FIRBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    fir_number: str
    registered_at: datetime
    created_at: datetime
    updated_at: datetime
