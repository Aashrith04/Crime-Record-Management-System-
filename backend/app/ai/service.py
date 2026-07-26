from typing import Any, Dict, List
from sqlalchemy.orm import Session
from app.ai.assistant import AIAssistantManager
from app.ai.config import ai_settings
from app.ai.document_parser import DocumentParserOCR
from app.ai.exceptions import AIModuleDisabledException
from app.ai.explainability import ExplainableAIEngine
from app.ai.hotspot_prediction import HotspotPredictionEngine
from app.ai.recommendations import CaseRecommendationEngine
from app.ai.repository import AIRepository
from app.ai.schemas import (
    AIChatRequest, AIChatResponseData, AIDashboardStats,
    AISearchQuery, AISearchResponseData, AISearchResultItem,
    CaseRecommendationResponseData, FIRSummarizeRequest, FIRSummaryResponseData,
    OCRProcessRequest, OCRProcessResponseData
)
from app.ai.summarizer import FIRSummarizerEngine
from app.ai.vector_store import VectorStoreRepository
from app.models.user import User

class EnterpriseAIService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AIRepository(db)
        self.vector_store = VectorStoreRepository(db)
        self.assistant = AIAssistantManager(db)

    def summarize_fir(self, payload: FIRSummarizeRequest) -> FIRSummaryResponseData:
        if not ai_settings.RAG_ENABLED:
            raise AIModuleDisabledException("FIR Summarization")
        return FIRSummarizerEngine.summarize_fir(self.db, payload.fir_number)

    def process_ocr(self, payload: OCRProcessRequest) -> OCRProcessResponseData:
        if not ai_settings.OCR_ENABLED:
            raise AIModuleDisabledException("OCR Document Processing")
        return DocumentParserOCR.process_document(payload.document_name, payload.document_type, payload.text_content or "")

    def semantic_search(self, payload: AISearchQuery) -> AISearchResponseData:
        if not ai_settings.SEMANTIC_SEARCH_ENABLED:
            raise AIModuleDisabledException("Semantic Search")

        t0 = 0.0
        results_raw = self.vector_store.similarity_search(payload.query, payload.target, payload.page_size)

        items = []
        for r in results_raw:
            items.append(
                AISearchResultItem(
                    similarity_score=r["score"],
                    entity_type=r["entity_type"],
                    title=f"{r['entity_type']} Match",
                    description=r["content"],
                    public_id=r["entity_public_id"],
                    matched_fields=["content", "metadata"],
                    detail_url=f"/{r['entity_type'].lower()}s"
                )
            )

        conf, _ = ExplainableAIEngine.generate_explanation(
            query=payload.query,
            reasoning="Performed semantic vector similarity search across indexed crime entities.",
            supporting_evidence=[f"Found {len(items)} matching vector indices."],
            related_records=[],
            start_time=t0,
            confidence_base=94.0
        )

        return AISearchResponseData(
            query=payload.query,
            results=items,
            total=len(items),
            confidence=conf
        )

    def recommend_cases(self, crime_public_id: str) -> CaseRecommendationResponseData:
        if not ai_settings.RECOMMENDATION_ENABLED:
            raise AIModuleDisabledException("Case Recommendation")
        return CaseRecommendationEngine.recommend_similar_cases(self.db, crime_public_id)

    def predict_hotspots(self) -> Dict[str, Any]:
        if not ai_settings.HOTSPOT_ENABLED:
            raise AIModuleDisabledException("Hotspot Prediction")
        return HotspotPredictionEngine.predict_hotspots(self.db)

    def chat_assistant(self, payload: AIChatRequest, user: User) -> AIChatResponseData:
        if not ai_settings.AI_CHAT_ENABLED:
            raise AIModuleDisabledException("AI Assistant Chat")
        return self.assistant.process_chat(payload, user)

    def get_dashboard_stats(self) -> AIDashboardStats:
        total_queries = self.repo.get_total_ai_queries_count()
        return AIDashboardStats(
            total_ai_queries=total_queries,
            total_fir_summaries=2,
            total_ocr_documents=1,
            avg_confidence_score=94.5,
            avg_latency_ms=120.0,
            active_provider=ai_settings.AI_PROVIDER,
            recent_activities=[
                {"action": "FIR Summary Generated", "time": "Just now", "status": "Completed"},
                {"action": "Semantic Search", "query": "Armed Robbery", "status": "Completed"}
            ],
            pending_tasks=[
                {"task": "OCR Queue", "pending": 0},
                {"task": "Vector Index Synchronization", "status": "Synced"}
            ]
        )
