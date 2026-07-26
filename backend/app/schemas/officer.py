from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead

class OfficerPerformanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    officer_id: int
    total_assigned_cases: int
    total_closed_cases: int
    avg_resolution_days: float
    performance_score: float
    officer: Optional[UserRead] = None

class OfficerWorkloadRead(BaseModel):
    officer: UserRead
    active_cases_count: int
    closed_cases_count: int
    performance_score: float
    availability_status: str # Available, High Workload, Overloaded
