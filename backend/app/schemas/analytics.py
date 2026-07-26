from typing import Dict, List
from pydantic import BaseModel

class CrimeTypeStat(BaseModel):
    category: str
    count: int
    percentage: float

class MonthlyCrimeTrend(BaseModel):
    month: str
    total_crimes: int
    resolved: int
    pending: int

class SeverityDistribution(BaseModel):
    severity: str
    count: int

class StationPerformance(BaseModel):
    station_name: str
    total_cases: int
    closed_cases: int
    resolution_rate: float

class AnalyticsOverviewData(BaseModel):
    total_crimes: int
    open_crimes: int
    under_investigation: int
    closed_crimes: int
    total_firs: int
    total_criminals: int
    total_evidences: int
    resolution_rate: float
    crime_type_distribution: List[CrimeTypeStat]
    monthly_trends: List[MonthlyCrimeTrend]
    severity_distribution: List[SeverityDistribution]
    station_performance: List[StationPerformance]
