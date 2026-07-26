from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class AIChatHistory(Base, BaseModelMixin):
    __tablename__ = "ai_chat_history"

    conversation_id = Column(String(100), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    provider = Column(String(50), default="baseline", nullable=False)
    latency_ms = Column(Float, default=0.0, nullable=False)
    confidence_score = Column(Float, default=0.95, nullable=False)
    references_json = Column(Text, nullable=True) # JSON list of cited DB records
    errors = Column(Text, nullable=True)

    user = relationship("User")

class FIRSummary(Base, BaseModelMixin):
    __tablename__ = "ai_fir_summaries"

    fir_id = Column(Integer, ForeignKey("firs.id", ondelete="CASCADE"), nullable=False)
    short_summary = Column(Text, nullable=False)
    detailed_summary = Column(Text, nullable=False)
    chronological_timeline_json = Column(Text, nullable=True)
    extracted_ipc_sections_json = Column(Text, nullable=True)
    extracted_entities_json = Column(Text, nullable=True)
    provider = Column(String(50), default="baseline", nullable=False)
    confidence_score = Column(Float, default=0.92, nullable=False)

    fir = relationship("FIR")

class OCRDocument(Base, BaseModelMixin):
    __tablename__ = "ai_ocr_documents"

    document_name = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False) # FIR, Evidence, Witness Statement, Charge Sheet
    raw_text = Column(Text, nullable=False)
    extracted_metadata_json = Column(Text, nullable=True) # JSON of names, addresses, phones, IPC sections, dates
    confidence_score = Column(Float, default=0.88, nullable=False)
    processing_time_ms = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="Processed", nullable=False)

class SemanticVectorIndex(Base, BaseModelMixin):
    __tablename__ = "ai_vector_indices"

    entity_type = Column(String(50), index=True, nullable=False) # Crime, FIR, Evidence, Criminal, Officer, Report
    entity_public_id = Column(String(100), index=True, nullable=False)
    content = Column(Text, nullable=False)
    vector_json = Column(Text, nullable=False) # JSON float array of vector embeddings
    metadata_json = Column(Text, nullable=True)
