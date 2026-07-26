from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class CriminalBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    alias: Optional[str] = None
    photo_url: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    identification_marks: Optional[str] = None
    wanted_status: str = Field(default="Not Wanted") # Wanted, Arrested, Released, Absconding

class CriminalCreate(CriminalBase):
    pass

class CriminalUpdate(BaseModel):
    full_name: Optional[str] = None
    alias: Optional[str] = None
    photo_url: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    identification_marks: Optional[str] = None
    wanted_status: Optional[str] = None

class CrimeCriminalLink(BaseModel):
    crime_id: int
    role_in_crime: str = Field(default="Suspect") # Prime Suspect, Accomplice, Convicted

class CrimeCriminalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    crime_id: int
    criminal_id: int
    role_in_crime: str

class CriminalRead(CriminalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    created_at: datetime
    updated_at: datetime
    crimes: List[CrimeCriminalRead] = []
