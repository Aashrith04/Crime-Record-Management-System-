from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.user import User
from app.schemas.ai import (
    FIRSummaryRequest,
    FIRSummaryResponse,
    NaturalLanguageSearchQuery,
    RepeatOffenderMatch,
    SeverityPredictionRequest,
    SeverityPredictionResponse
)
from app.schemas.common import StandardResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["Law Enforcement AI Module"])

@router.post("/summarize-fir", response_model=StandardResponse[FIRSummaryResponse])
def summarize_fir_endpoint(
    payload: FIRSummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    summary = AIService.summarize_fir(db, payload.fir_number)
    return StandardResponse(
        success=True,
        message="FIR summarized using AI NLP analyzer.",
        data=summary
    )

@router.post("/predict-severity", response_model=StandardResponse[SeverityPredictionResponse])
def predict_severity_endpoint(
    payload: SeverityPredictionRequest,
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    prediction = AIService.predict_severity(
        crime_type=payload.crime_type,
        description=payload.description,
        location_name=payload.location_name
    )
    return StandardResponse(
        success=True,
        message="Crime severity and risk analysis predicted.",
        data=prediction
    )

@router.post("/repeat-offenders", response_model=StandardResponse[List[RepeatOffenderMatch]])
def find_repeat_offenders_endpoint(
    payload: NaturalLanguageSearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.AI_ASSISTANT_USE))
):
    matches = AIService.find_repeat_offenders(db, payload.query)
    return StandardResponse(
        success=True,
        message="Repeat offender pattern search complete.",
        data=matches
    )
