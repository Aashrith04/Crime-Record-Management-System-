from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class Investigation(Base, BaseModelMixin):
    __tablename__ = "investigations"

    crime_id = Column(Integer, ForeignKey("crimes.id", ondelete="CASCADE"), unique=True, nullable=False)
    lead_investigator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="In Progress", nullable=False) # In Progress, Pending Chargesheet, Closed, Cold Case
    summary = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    crime = relationship("Crime", back_populates="investigation")
    lead_investigator = relationship("User", foreign_keys=[lead_investigator_id])
    case_diaries = relationship("CaseDiary", back_populates="investigation", cascade="all, delete-orphan")

class CaseDiary(Base, BaseModelMixin):
    __tablename__ = "case_diaries"

    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    investigation = relationship("Investigation", back_populates="case_diaries")
    author = relationship("User")
