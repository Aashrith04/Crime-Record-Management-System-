from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict

class SystemSettingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    key: str
    value: str
    category: str
    description: Optional[str] = None

class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

class DepartmentSettingsData(BaseModel):
    crime_categories: List[str]
    evidence_categories: List[str]
    ranks: List[str]
    police_stations: List[str]
    storage_locations: List[str]
    case_priorities: List[str]
    theme: str = "dark"
