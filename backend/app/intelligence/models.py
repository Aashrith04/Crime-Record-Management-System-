from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class EntityResolution(Base, BaseModelMixin):
    __tablename__ = "entity_resolution"

    entity_type = Column(String(50), index=True, nullable=False) # Suspect, Criminal, Victim, Witness
    canonical_name = Column(String(255), index=True, nullable=False)
    confidence = Column(Float, default=90.0, nullable=False)
    source_records_json = Column(Text, nullable=False) # JSON list of merged record IDs
    metadata_json = Column(Text, nullable=True) # JSON of phone, address, aliases, IDs
    status = Column(String(50), default="Resolved", nullable=False)

class EntityRelationship(Base, BaseModelMixin):
    __tablename__ = "entity_relationships"

    source_entity_public_id = Column(String(100), index=True, nullable=False)
    target_entity_public_id = Column(String(100), index=True, nullable=False)
    relationship_type = Column(String(100), nullable=False) # KNOWS, ASSOCIATED_WITH, PARTICIPATED_IN, OWNS, LOCATED_AT, INVESTIGATED_BY, USED_IN
    strength = Column(Float, default=1.0, nullable=False)
    confidence = Column(Float, default=95.0, nullable=False)

class CrossCaseLink(Base, BaseModelMixin):
    __tablename__ = "cross_case_links"

    crime_a_public_id = Column(String(100), index=True, nullable=False)
    crime_b_public_id = Column(String(100), index=True, nullable=False)
    match_score = Column(Float, default=85.0, nullable=False)
    matching_reason = Column(Text, nullable=False)
    matching_entities_json = Column(Text, nullable=True) # Shared vehicles, phones, MO, evidence
    status = Column(String(50), default="Linked", nullable=False) # Linked, Confirmed, False Positive

class CrossCaseFeedback(Base, BaseModelMixin):
    __tablename__ = "cross_case_feedback"

    cross_case_link_id = Column(Integer, ForeignKey("cross_case_links.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    feedback = Column(String(50), nullable=False) # Confirmed, False Positive
    notes = Column(Text, nullable=True)

class InvestigationScore(Base, BaseModelMixin):
    __tablename__ = "investigation_scores"

    crime_public_id = Column(String(100), index=True, nullable=False)
    completion_score = Column(Float, default=75.0, nullable=False)
    missing_items_json = Column(Text, nullable=True) # JSON array of missing evidence/witnesses
    risk_score = Column(Float, default=40.0, nullable=False)
    recommendations_json = Column(Text, nullable=True)

class OfficerAIMetric(Base, BaseModelMixin):
    __tablename__ = "officer_ai_metrics"

    officer_public_id = Column(String(100), index=True, nullable=False)
    workload = Column(Integer, default=5, nullable=False)
    efficiency = Column(Float, default=88.5, nullable=False)
    active_cases = Column(Integer, default=3, nullable=False)
    closure_rate = Column(Float, default=70.0, nullable=False)
    risk_level = Column(String(50), default="Low", nullable=False)
    recommendation = Column(Text, nullable=True)

class TimelineAnalysis(Base, BaseModelMixin):
    __tablename__ = "timeline_analysis"

    crime_public_id = Column(String(100), index=True, nullable=False)
    delay_score = Column(Float, default=12.0, nullable=False)
    anomalies_json = Column(Text, nullable=True)
    predictions_json = Column(Text, nullable=True)
    timeline_summary = Column(Text, nullable=False)

class IntelligenceAlert(Base, BaseModelMixin):
    __tablename__ = "intelligence_alerts"

    alert_type = Column(String(100), index=True, nullable=False) # High Risk Offender, Modus Operandi Link
    priority = Column(String(50), default="High", nullable=False) # High, Critical, Medium
    crime_public_id = Column(String(100), index=True, nullable=True)
    description = Column(Text, nullable=False)
    confidence = Column(Float, default=92.0, nullable=False)
    status = Column(String(50), default="Active", nullable=False)
