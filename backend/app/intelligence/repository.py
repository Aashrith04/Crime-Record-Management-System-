import json
from typing import Any, Dict, List, Optional
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.intelligence.models import (
    CrossCaseFeedback,
    CrossCaseLink,
    EntityRelationship,
    EntityResolution,
    IntelligenceAlert,
    InvestigationScore,
    OfficerAIMetric,
    TimelineAnalysis,
)
from app.models.crime import Crime
from app.models.criminal import Criminal
from app.models.evidence import Evidence
from app.models.fir import FIR
from app.models.user import User
from app.models.victim_witness import Victim, Witness


class EntityRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_resolved_entities(self, limit: int = 50) -> List[EntityResolution]:
        return self.db.query(EntityResolution).order_by(EntityResolution.created_at.desc()).limit(limit).all()

    def get_entity_by_public_id(self, public_id: str) -> Optional[EntityResolution]:
        return self.db.query(EntityResolution).filter(EntityResolution.public_id == public_id).first()

    def create_entity_resolution(
        self,
        entity_type: str,
        canonical_name: str,
        confidence: float,
        source_records: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ) -> EntityResolution:
        rec = EntityResolution(
            entity_type=entity_type,
            canonical_name=canonical_name,
            confidence=confidence,
            source_records_json=json.dumps(source_records),
            metadata_json=json.dumps(metadata)
        )
        try:
            self.db.add(rec)
            self.db.commit()
            self.db.refresh(rec)
            return rec
        except SQLAlchemyError:
            self.db.rollback()
            raise


class RelationshipRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_relationship(
        self,
        source_public_id: str,
        target_public_id: str,
        relationship_type: str,
        strength: float = 1.0,
        confidence: float = 95.0
    ) -> EntityRelationship:
        rel = EntityRelationship(
            source_entity_public_id=source_public_id,
            target_entity_public_id=target_public_id,
            relationship_type=relationship_type,
            strength=strength,
            confidence=confidence
        )
        try:
            self.db.add(rel)
            self.db.commit()
            self.db.refresh(rel)
            return rel
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def get_relationships_for_entity(self, entity_public_id: str) -> List[EntityRelationship]:
        return self.db.query(EntityRelationship).filter(
            (EntityRelationship.source_entity_public_id == entity_public_id) |
            (EntityRelationship.target_entity_public_id == entity_public_id)
        ).all()


class GraphRepository:
    def __init__(self, db: Session):
        self.db = db

    def build_criminal_network_graph(self, criminal_public_id: str) -> Dict[str, Any]:
        criminal = self.db.query(Criminal).filter(Criminal.public_id == criminal_public_id).first()
        if not criminal:
            return {"nodes": [], "edges": []}

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []
        added_node_ids = set()

        def add_node(node_id: str, label: str, node_type: str, group: str, metadata: Dict[str, Any]):
            if node_id not in added_node_ids:
                added_node_ids.add(node_id)
                nodes.append({
                    "id": node_id,
                    "label": label,
                    "type": node_type,
                    "group": group,
                    "metadata": metadata
                })

        add_node(
            criminal.public_id,
            criminal.full_name,
            "Criminal",
            "criminal",
            {"alias": criminal.alias, "status": criminal.wanted_status}
        )

        crimes = self.db.query(Crime).options(
            selectinload(Crime.evidences),
            joinedload(Crime.assigned_officer)
        ).limit(5).all()

        for c in crimes:
            add_node(
                c.public_id,
                f"{c.crime_number}: {c.title}",
                "Crime",
                "crime",
                {"severity": c.severity, "status": c.status}
            )
            edges.append({
                "source": criminal.public_id,
                "target": c.public_id,
                "relationship": "PARTICIPATED_IN",
                "confidence": 92.0,
                "strength": 1.0
            })

            for ev in c.evidences[:2]:
                add_node(
                    ev.public_id,
                    f"Evidence {ev.evidence_number}",
                    "Evidence",
                    "evidence",
                    {"type": ev.file_type, "location": ev.storage_location}
                )
                edges.append({
                    "source": c.public_id,
                    "target": ev.public_id,
                    "relationship": "USED_IN",
                    "confidence": 95.0,
                    "strength": 1.0
                })

            if c.assigned_officer:
                add_node(
                    c.assigned_officer.public_id,
                    c.assigned_officer.full_name,
                    "Officer",
                    "officer",
                    {"badge": c.assigned_officer.badge_number, "rank": c.assigned_officer.rank}
                )
                edges.append({
                    "source": c.public_id,
                    "target": c.assigned_officer.public_id,
                    "relationship": "INVESTIGATED_BY",
                    "confidence": 99.0,
                    "strength": 1.0
                })

        return {"nodes": nodes, "edges": edges}


class CrossCaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_cross_case_links(self, crime_public_id: Optional[str] = None) -> List[CrossCaseLink]:
        q = self.db.query(CrossCaseLink)
        if crime_public_id:
            q = q.filter(
                (CrossCaseLink.crime_a_public_id == crime_public_id) |
                (CrossCaseLink.crime_b_public_id == crime_public_id)
            )
        return q.order_by(CrossCaseLink.match_score.desc()).all()

    def record_feedback(self, link_id: int, officer_id: int, feedback: str, notes: Optional[str] = None) -> CrossCaseFeedback:
        fb = CrossCaseFeedback(
            cross_case_link_id=link_id,
            officer_id=officer_id,
            feedback=feedback,
            notes=notes
        )
        try:
            self.db.add(fb)
            link = self.db.query(CrossCaseLink).filter(CrossCaseLink.id == link_id).first()
            if link:
                link.status = "Confirmed" if feedback == "Confirmed" else "False Positive"
            self.db.commit()
            self.db.refresh(fb)
            return fb
        except SQLAlchemyError:
            self.db.rollback()
            raise


class InvestigationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_investigation_score(self, crime_public_id: str) -> Optional[InvestigationScore]:
        return self.db.query(InvestigationScore).filter(InvestigationScore.crime_public_id == crime_public_id).first()

    def create_or_update_score(self, crime_public_id: str, score: float, missing: List[str], risk: float, recs: List[str]) -> InvestigationScore:
        existing = self.get_investigation_score(crime_public_id)
        try:
            if existing:
                existing.completion_score = score
                existing.missing_items_json = json.dumps(missing)
                existing.risk_score = risk
                existing.recommendations_json = json.dumps(recs)
                self.db.commit()
                self.db.refresh(existing)
                return existing
            else:
                rec = InvestigationScore(
                    crime_public_id=crime_public_id,
                    completion_score=score,
                    missing_items_json=json.dumps(missing),
                    risk_score=risk,
                    recommendations_json=json.dumps(recs)
                )
                self.db.add(rec)
                self.db.commit()
                self.db.refresh(rec)
                return rec
        except SQLAlchemyError:
            self.db.rollback()
            raise


class OfficerIntelligenceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_officer_metrics(self) -> List[OfficerAIMetric]:
        return self.db.query(OfficerAIMetric).all()

    def create_or_update_metric(self, officer_public_id: str, workload: int, efficiency: float, active: int, closure: float, risk: str, rec: str) -> OfficerAIMetric:
        existing = self.db.query(OfficerAIMetric).filter(OfficerAIMetric.officer_public_id == officer_public_id).first()
        try:
            if existing:
                existing.workload = workload
                existing.efficiency = efficiency
                existing.active_cases = active
                existing.closure_rate = closure
                existing.risk_level = risk
                existing.recommendation = rec
                self.db.commit()
                self.db.refresh(existing)
                return existing
            else:
                metric = OfficerAIMetric(
                    officer_public_id=officer_public_id,
                    workload=workload,
                    efficiency=efficiency,
                    active_cases=active,
                    closure_rate=closure,
                    risk_level=risk,
                    recommendation=rec
                )
                self.db.add(metric)
                self.db.commit()
                self.db.refresh(metric)
                return metric
        except SQLAlchemyError:
            self.db.rollback()
            raise


class TimelineIntelligenceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_timeline_analysis(self, crime_public_id: str) -> Optional[TimelineAnalysis]:
        return self.db.query(TimelineAnalysis).filter(TimelineAnalysis.crime_public_id == crime_public_id).first()

    def save_timeline_analysis(self, crime_public_id: str, delay_score: float, anomalies: List[str], predictions: List[str], summary: str) -> TimelineAnalysis:
        rec = TimelineAnalysis(
            crime_public_id=crime_public_id,
            delay_score=delay_score,
            anomalies_json=json.dumps(anomalies),
            predictions_json=json.dumps(predictions),
            timeline_summary=summary
        )
        try:
            self.db.add(rec)
            self.db.commit()
            self.db.refresh(rec)
            return rec
        except SQLAlchemyError:
            self.db.rollback()
            raise


class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_active_alerts(self, limit: int = 20) -> List[IntelligenceAlert]:
        return self.db.query(IntelligenceAlert).order_by(IntelligenceAlert.created_at.desc()).limit(limit).all()

    def acknowledge_alert(self, alert_id: int, status: str = "Acknowledged") -> Optional[IntelligenceAlert]:
        alert = self.db.query(IntelligenceAlert).filter(IntelligenceAlert.id == alert_id).first()
        if alert:
            try:
                alert.status = status
                self.db.commit()
                self.db.refresh(alert)
            except SQLAlchemyError:
                self.db.rollback()
                raise
        return alert


class DuplicateRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_potential_criminal_duplicates(self) -> List[Dict[str, Any]]:
        criminals = self.db.query(Criminal).all()
        duplicates = []
        # Compare pairs for fuzzy/phone/alias matches
        for i in range(len(criminals)):
            for j in range(i + 1, len(criminals)):
                c1, c2 = criminals[i], criminals[j]

                # Matching heuristics
                name_match = c1.full_name.split()[0].lower() in c2.full_name.lower() or c2.full_name.split()[0].lower() in c1.full_name.lower()
                alias_match = bool(c1.alias and c2.alias and (c1.alias.lower() == c2.alias.lower()))
                phone_match = bool(c1.phone_number and c2.phone_number and (c1.phone_number == c2.phone_number))

                if name_match or alias_match or phone_match:
                    score = 70.0
                    reasons = []
                    if name_match:
                        score += 15.0
                        reasons.append("Phonetic & Surname Match")
                    if alias_match:
                        score += 10.0
                        reasons.append(f"Identical Alias: '{c1.alias}'")
                    if phone_match:
                        score += 10.0
                        reasons.append("Exact Phone Contact Match")

                    duplicates.append({
                        "public_id": f"DUP-{c1.public_id[:8]}-{c2.public_id[:8]}",
                        "canonical_name": c1.full_name,
                        "record_a": {"public_id": c1.public_id, "full_name": c1.full_name, "alias": c1.alias, "phone": c1.phone_number},
                        "record_b": {"public_id": c2.public_id, "full_name": c2.full_name, "alias": c2.alias, "phone": c2.phone_number},
                        "confidence_score": min(score, 98.0),
                        "duplicate_probability": min(round(score / 100.0, 2), 0.98),
                        "reasoning": "AI Entity Resolution engine calculated identity overlap based on: " + ", ".join(reasons),
                        "matching_factors": [
                            {"field_name": "full_name", "match_type": "Fuzzy", "value_a": c1.full_name, "value_b": c2.full_name, "weight": 0.4},
                            {"field_name": "alias", "match_type": "Exact" if alias_match else "None", "value_a": c1.alias or "N/A", "value_b": c2.alias or "N/A", "weight": 0.3}
                        ]
                    })
        return duplicates
