import time
from typing import Any, Dict, List
from app.ai.schemas import AIConfidenceMeta, AIExplainabilityMeta

class ExplainableAIEngine:
    @staticmethod
    def generate_explanation(
        query: str,
        reasoning: str,
        supporting_evidence: List[str],
        related_records: List[Dict[str, Any]],
        start_time: float,
        confidence_base: float = 95.0,
        provider: str = "baseline"
    ) -> (AIConfidenceMeta, AIExplainabilityMeta):
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        ev_count = len(supporting_evidence)

        category = "High" if confidence_base >= 85.0 else "Medium" if confidence_base >= 60.0 else "Low"

        confidence = AIConfidenceMeta(
            confidence_percentage=confidence_base,
            confidence_category=category,
            evidence_count=ev_count,
            provider=provider,
            processing_time_ms=elapsed_ms,
            reliability_score=round(confidence_base / 100.0, 2)
        )

        explainability = AIExplainabilityMeta(
            reasoning_summary=reasoning,
            supporting_evidence=supporting_evidence,
            related_records=related_records,
            explanation=f"AI model computed finding for '{query}' based on {ev_count} verified database records."
        )

        return confidence, explainability
