from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

# Victim Schemas
class VictimBase(BaseModel):
    crime_id: int
    full_name: str = Field(..., min_length=2, max_length=255)
    contact: Optional[str] = None
    address: Optional[str] = None
    statement: Optional[str] = None
    medical_report_url: Optional[str] = None

class VictimCreate(VictimBase):
    pass

class VictimUpdate(BaseModel):
    full_name: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None
    statement: Optional[str] = None
    medical_report_url: Optional[str] = None

class VictimRead(VictimBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    created_at: datetime

# Witness Schemas
class WitnessBase(BaseModel):
    crime_id: int
    full_name: str = Field(..., min_length=2, max_length=255)
    contact: Optional[str] = None
    address: Optional[str] = None
    statement: Optional[str] = None
    is_protected: bool = False

class WitnessCreate(WitnessBase):
    pass

class WitnessUpdate(BaseModel):
    full_name: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None
    statement: Optional[str] = None
    is_protected: Optional[bool] = None

class WitnessRead(WitnessBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    created_at: datetime
