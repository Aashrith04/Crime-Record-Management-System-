from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.ai.config import ai_settings
from app.ai.dependencies import get_ai_service
from app.ai.schemas import (
    AIChatRequest, AIChatResponseData, AIDashboardStats,
    AISearchQuery, AISearchResponseData, CaseRecommendationResponseData,
    FIRSummarizeRequest, FIRSummaryResponseData, OCRProcessRequest,
    OCRProcessResponseData
)
from app.ai.service import EnterpriseAIService
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.user import User
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/ai", tags=["Law Enforcement AI Module"])

@router.post("/chat", response_model=StandardResponse[AIChatResponseData])
def ai_chat_assistant(
    payload: AIChatRequest,
    service: EnterpriseAIService = Depends(get_ai_service),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    res = service.chat_assistant(payload, current_user)
    return StandardResponse(
        success=True,
        message="AI Assistant response generated.",
        data=res
    )

@router.post("/summarize-fir", response_model=StandardResponse[FIRSummaryResponseData])
def summarize_fir_endpoint(
    payload: FIRSummarizeRequest,
    service: EnterpriseAIService = Depends(get_ai_service),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    summary = service.summarize_fir(payload)
    return StandardResponse(
        success=True,
        message="FIR summarized using AI NLP analyzer.",
        data=summary
    )

@router.post("/ocr", response_model=StandardResponse[OCRProcessResponseData])
def process_ocr_document(
    payload: OCRProcessRequest,
    service: EnterpriseAIService = Depends(get_ai_service),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    res = service.process_ocr(payload)
    return StandardResponse(
        success=True,
        message="Document processed with OCR field extraction.",
        data=res
    )

@router.post("/semantic-search", response_model=StandardResponse[AISearchResponseData])
def semantic_search_endpoint(
    payload: AISearchQuery,
    service: EnterpriseAIService = Depends(get_ai_service),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    res = service.semantic_search(payload)
    return StandardResponse(
        success=True,
        message="Semantic vector search completed.",
        data=res
    )

@router.get("/recommendations/{crime_public_id}", response_model=StandardResponse[CaseRecommendationResponseData])
def get_similar_case_recommendations(
    crime_public_id: str,
    service: EnterpriseAIService = Depends(get_ai_service),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    res = service.recommend_cases(crime_public_id)
    return StandardResponse(
        success=True,
        message="Similar case recommendations generated.",
        data=res
    )

@router.get("/hotspots", response_model=StandardResponse[Dict[str, Any]])
def predict_hotspots_endpoint(
    service: EnterpriseAIService = Depends(get_ai_service),
    current_user: User = Depends(require_permissions(PermissionEnum.ANALYTICS_VIEW))
):
    res = service.predict_hotspots()
    return StandardResponse(
        success=True,
        message="Crime hotspot prediction generated.",
        data=res
    )

@router.get("/dashboard-stats", response_model=StandardResponse[AIDashboardStats])
def get_ai_dashboard_stats(
    service: EnterpriseAIService = Depends(get_ai_service),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    stats = service.get_dashboard_stats()
    return StandardResponse(
        success=True,
        message="AI Dashboard metrics retrieved.",
        data=stats
    )

@router.get("/config", response_model=StandardResponse[Dict[str, Any]])
def get_ai_config(
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    return StandardResponse(
        success=True,
        message="AI Module configuration & feature flags.",
        data={
            "provider": ai_settings.AI_PROVIDER,
            "fallback_provider": ai_settings.AI_FALLBACK_PROVIDER,
            "model_name": ai_settings.AI_MODEL_NAME,
            "flags": {
                "AI_CHAT_ENABLED": ai_settings.AI_CHAT_ENABLED,
                "OCR_ENABLED": ai_settings.OCR_ENABLED,
                "RAG_ENABLED": ai_settings.RAG_ENABLED,
                "SEMANTIC_SEARCH_ENABLED": ai_settings.SEMANTIC_SEARCH_ENABLED,
                "RECOMMENDATION_ENABLED": ai_settings.RECOMMENDATION_ENABLED,
                "HOTSPOT_ENABLED": ai_settings.HOTSPOT_ENABLED,
            }
        }
    )
