from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.crime import Crime
from app.models.criminal import Criminal
from app.models.fir import FIR
from app.schemas.ai import (
    FIRSummaryResponse,
    SeverityPredictionResponse,
    RepeatOffenderMatch
)

class AIService:
    @staticmethod
    def summarize_fir(db: Session, fir_number: str) -> FIRSummaryResponse:
        fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()
        if not fir:
            return FIRSummaryResponse(
                fir_number=fir_number,
                key_incident_summary="FIR record not found in system databases.",
                applicable_sections=[],
                risk_level="Unknown",
                suggested_action_plan=["Verify FIR number entry."]
            )
        
        # Rule-based NLP synthesis
        details = fir.incident_details
        sections = [s.strip() for s in fir.sections_of_law.split(",") if s.strip()]
        
        risk = "Moderate"
        if any(sec in fir.sections_of_law for sec in ["302", "307", "395", "376", "IPC 302"]):
            risk = "Critical"
        elif any(sec in fir.sections_of_law for sec in ["379", "420", "323"]):
            risk = "High"

        summary = f"Incident reported by {fir.complainant_name}. Primary allegations involve {details[:150]}..."

        actions = [
            "Dispatch forensic team to scene if physical evidence reported.",
            "Record formal witness statements under Section 161 CrPC.",
            "Review CCTV footage near registered location coords."
        ]

        return FIRSummaryResponse(
            fir_number=fir.fir_number,
            key_incident_summary=summary,
            applicable_sections=sections,
            risk_level=risk,
            suggested_action_plan=actions
        )

    @staticmethod
    def predict_severity(crime_type: str, description: str, location_name: str) -> SeverityPredictionResponse:
        desc_lower = description.lower()
        type_lower = crime_type.lower()

        risk_factors = []
        severity = "Moderate"
        confidence = 0.88
        priority = "Medium"

        if any(w in desc_lower for w in ["firearm", "weapon", "homicide", "kill", "murder", "kidnap", "explosive"]):
            severity = "Critical"
            priority = "Critical"
            confidence = 0.96
            risk_factors.append("Use of lethal force / weapons detected")
            risk_factors.append("Immediate threat to public safety")
        elif any(w in desc_lower for w in ["cyber", "fraud", "robbery", "stolen", "burglary", "extortion"]):
            severity = "Severe"
            priority = "High"
            confidence = 0.91
            risk_factors.append("Significant financial asset / property damage")
        elif any(w in desc_lower for w in ["assault", "brawl", "theft", "snatching"]):
            severity = "Moderate"
            priority = "Medium"
            confidence = 0.85
            risk_factors.append("Physical altercation reported")
        else:
            severity = "Minor"
            priority = "Low"
            confidence = 0.78
            risk_factors.append("Non-violent misdemeanor pattern")

        return SeverityPredictionResponse(
            predicted_severity=severity,
            confidence_score=confidence,
            risk_factors=risk_factors,
            priority_level=priority
        )

    @staticmethod
    def find_repeat_offenders(db: Session, query_term: str) -> List[RepeatOffenderMatch]:
        criminals = db.query(Criminal).filter(
            or_(
                Criminal.full_name.ilike(f"%{query_term}%"),
                Criminal.alias.ilike(f"%{query_term}%"),
                Criminal.identification_marks.ilike(f"%{query_term}%")
            )
        ).limit(10).all()

        results = []
        for c in criminals:
            past_crimes_count = len(c.crimes)
            score = min(0.99, 0.60 + (past_crimes_count * 0.10))
            patterns = [f"Linked to {past_crimes_count} past crime files", f"Status: {c.wanted_status}"]
            if c.identification_marks:
                patterns.append(f"Marks: {c.identification_marks}")

            results.append(
                RepeatOffenderMatch(
                    criminal_public_id=c.public_id,
                    full_name=c.full_name,
                    alias=c.alias,
                    similarity_score=score,
                    past_crimes_count=past_crimes_count,
                    matching_patterns=patterns
                )
            )

        return results
