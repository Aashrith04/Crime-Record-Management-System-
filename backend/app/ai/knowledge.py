from typing import Any, Dict, List
from sqlalchemy.orm import Session
from app.models.crime import Crime
from app.models.evidence import Evidence
from app.models.fir import FIR
from app.models.user import User

class CrimeContextBuilder:
    @staticmethod
    def build(db: Session, query_text: str) -> List[Dict[str, Any]]:
        pattern = f"%{query_text}%"
        crimes = db.query(Crime).filter(
            (Crime.title.ilike(pattern)) | (Crime.crime_number.ilike(pattern)) | (Crime.description.ilike(pattern))
        ).limit(5).all()
        
        ctx = []
        for c in crimes:
            ctx.append({
                "type": "Crime",
                "crime_number": c.crime_number,
                "title": c.title,
                "severity": c.severity,
                "status": c.status,
                "description": c.description,
                "location": c.location_name
            })
        return ctx

class EvidenceContextBuilder:
    @staticmethod
    def build(db: Session, query_text: str) -> List[Dict[str, Any]]:
        pattern = f"%{query_text}%"
        evidences = db.query(Evidence).filter(
            (Evidence.evidence_number.ilike(pattern)) | (Evidence.file_name.ilike(pattern)) | (Evidence.barcode.ilike(pattern))
        ).limit(5).all()

        ctx = []
        for e in evidences:
            ctx.append({
                "type": "Evidence",
                "evidence_number": e.evidence_number,
                "file_name": e.file_name,
                "media_type": e.file_type,
                "storage_location": e.storage_location,
                "barcode": e.barcode
            })
        return ctx

class OfficerContextBuilder:
    @staticmethod
    def build(db: Session, query_text: str) -> List[Dict[str, Any]]:
        pattern = f"%{query_text}%"
        officers = db.query(User).filter(
            (User.full_name.ilike(pattern)) | (User.badge_number.ilike(pattern)) | (User.rank.ilike(pattern))
        ).limit(5).all()

        ctx = []
        for o in officers:
            ctx.append({
                "type": "Officer",
                "full_name": o.full_name,
                "badge_number": o.badge_number,
                "rank": o.rank,
                "station_name": o.station_name
            })
        return ctx
