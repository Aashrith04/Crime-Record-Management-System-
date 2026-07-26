from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class Evidence(Base, BaseModelMixin):
    __tablename__ = "evidences"

    evidence_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. EVD-2026-0001
    crime_id = Column(Integer, ForeignKey("crimes.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # image, video, audio, pdf, document
    file_url = Column(Text, nullable=False)

    cloudinary_public_id = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    storage_location = Column(String(255), default="Central Vault Locker A-1", nullable=False)
    status = Column(String(50), default="In Locker", nullable=False, index=True) # In Locker, In Lab, Court Presentation, Disposed
    version = Column(Integer, default=1, nullable=False)
    version_history = Column(Text, nullable=True) # JSON string of replaced file versions

    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    crime = relationship("Crime", back_populates="evidences")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    chain_of_custody = relationship("EvidenceChainOfCustody", back_populates="evidence", cascade="all, delete-orphan")

class EvidenceChainOfCustody(Base, BaseModelMixin):
    __tablename__ = "evidence_chain_of_custody"

    evidence_id = Column(Integer, ForeignKey("evidences.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False) # Checked In, Checked Out, Transferred to Lab, Presented in Court, Returned
    moved_from = Column(String(255), nullable=True)
    moved_to = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    approval_status = Column(String(50), default="Approved", nullable=False) # Approved, Rejected, Pending Approval
    digital_signature_hash = Column(String(255), nullable=True)
    handled_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    evidence = relationship("Evidence", back_populates="chain_of_custody")
    handled_by = relationship("User")
