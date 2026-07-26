from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class FIR(Base, BaseModelMixin):
    __tablename__ = "firs"

    fir_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. FIR-2026-9081
    crime_id = Column(Integer, ForeignKey("crimes.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    complainant_name = Column(String(255), nullable=False, index=True)
    complainant_contact = Column(String(100), nullable=False)
    complainant_address = Column(Text, nullable=True)
    
    incident_details = Column(Text, nullable=False)
    sections_of_law = Column(String(255), nullable=False, index=True) # e.g. IPC Section 379, 420
    status = Column(String(50), default="Registered", nullable=False, index=True) # Registered, Under Review, Verified, Closed
    registered_at = Column(DateTime(timezone=True), nullable=False, index=True)

    __table_args__ = (
        Index("idx_fir_status_registered", "status", "registered_at"),
    )

    crime = relationship("Crime", back_populates="fir")
