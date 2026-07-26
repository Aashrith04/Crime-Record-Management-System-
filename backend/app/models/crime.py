from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class Crime(Base, BaseModelMixin):
    __tablename__ = "crimes"

    crime_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. CR-2026-0001
    title = Column(String(255), nullable=False, index=True)
    crime_type = Column(String(100), nullable=False, index=True) # e.g. Robbery, Assault, Cybercrime, Other
    custom_crime_type = Column(String(100), nullable=True) # Used when crime_type is "Other"
    description = Column(Text, nullable=False)
    
    crime_date = Column(DateTime(timezone=True), nullable=False, index=True)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    priority = Column(String(50), default="Medium", nullable=False, index=True) # Low, Medium, High, Critical
    severity = Column(String(50), default="Moderate", nullable=False, index=True) # Minor, Moderate, Severe, Critical
    status = Column(String(50), default="Open", nullable=False, index=True) # Open, Under Investigation, Pending Approval, Closed

    assigned_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Composite Indexes for High-Frequency Analytical & Filter Queries
    __table_args__ = (
        Index("idx_crime_type_status", "crime_type", "status"),
        Index("idx_severity_is_deleted", "severity", "is_deleted"),
        Index("idx_crime_date_status", "crime_date", "status"),
    )

    # Relationships
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    fir = relationship("FIR", back_populates="crime", uselist=False, cascade="all, delete-orphan")
    timeline_entries = relationship("CrimeTimeline", back_populates="crime", cascade="all, delete-orphan")
    criminals = relationship("CrimeCriminal", back_populates="crime", cascade="all, delete-orphan")
    victims = relationship("Victim", back_populates="crime", cascade="all, delete-orphan")
    witnesses = relationship("Witness", back_populates="crime", cascade="all, delete-orphan")
    evidences = relationship("Evidence", back_populates="crime", cascade="all, delete-orphan")
    investigation = relationship("Investigation", back_populates="crime", uselist=False, cascade="all, delete-orphan")

class CrimeTimeline(Base, BaseModelMixin):
    __tablename__ = "crime_timelines"

    crime_id = Column(Integer, ForeignKey("crimes.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    event_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    performed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    crime = relationship("Crime", back_populates="timeline_entries")
    performed_by = relationship("User")
