from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class Victim(Base, BaseModelMixin):
    __tablename__ = "victims"

    crime_id = Column(Integer, ForeignKey("crimes.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    contact = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    statement = Column(Text, nullable=True)
    medical_report_url = Column(Text, nullable=True)

    crime = relationship("Crime", back_populates="victims")

class Witness(Base, BaseModelMixin):
    __tablename__ = "witnesses"

    crime_id = Column(Integer, ForeignKey("crimes.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    contact = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    statement = Column(Text, nullable=True)
    is_protected = Column(Boolean, default=False, nullable=False)

    crime = relationship("Crime", back_populates="witnesses")
