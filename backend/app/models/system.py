from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class Notification(Base, BaseModelMixin):
    __tablename__ = "notifications"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO", nullable=False) # CASE_ASSIGNED, EVIDENCE_UPLOADED, EVIDENCE_TRANSFERRED, FIR_REGISTERED, CASE_CLOSED
    is_read = Column(Boolean, default=False, nullable=False)
    link = Column(String(255), nullable=True)

    user = relationship("User")

class AuditLog(Base, BaseModelMixin):
    __tablename__ = "audit_logs"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True) # e.g. CRIME_CREATED, USER_LOGIN
    entity_type = Column(String(100), nullable=False, index=True) # e.g. Crime, User, FIR
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)

    user = relationship("User")

class OfficerPerformance(Base, BaseModelMixin):
    __tablename__ = "officer_performances"

    officer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_assigned_cases = Column(Integer, default=0, nullable=False)
    total_closed_cases = Column(Integer, default=0, nullable=False)
    avg_resolution_days = Column(Float, default=0.0, nullable=False)
    performance_score = Column(Float, default=100.0, nullable=False)

    officer = relationship("User")

class SystemSettings(Base, BaseModelMixin):
    __tablename__ = "system_settings"

    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    category = Column(String(50), default="General", nullable=False)
    description = Column(String(255), nullable=True)
