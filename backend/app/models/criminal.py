from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class Criminal(Base, BaseModelMixin):
    __tablename__ = "criminals"

    full_name = Column(String(255), nullable=False, index=True)
    alias = Column(String(100), nullable=True)
    photo_url = Column(Text, nullable=True)
    dob = Column(DateTime(timezone=True), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    identification_marks = Column(Text, nullable=True)
    wanted_status = Column(String(50), default="Not Wanted", nullable=False, index=True) # Wanted, Arrested, Released, Absconding

    crimes = relationship("CrimeCriminal", back_populates="criminal", cascade="all, delete-orphan")

class CrimeCriminal(Base, BaseModelMixin):
    __tablename__ = "crime_criminals"

    crime_id = Column(Integer, ForeignKey("crimes.id", ondelete="CASCADE"), nullable=False)
    criminal_id = Column(Integer, ForeignKey("criminals.id", ondelete="CASCADE"), nullable=False)
    role_in_crime = Column(String(100), default="Suspect", nullable=False) # Prime Suspect, Accomplice, Convicted

    crime = relationship("Crime", back_populates="criminals")
    criminal = relationship("Criminal", back_populates="crimes")
