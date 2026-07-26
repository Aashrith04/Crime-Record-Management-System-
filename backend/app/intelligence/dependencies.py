from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.intelligence.service import (
    AlertEngineService, CriminalNetworkService, CrossCaseIntelligenceService,
    EntityMergeService, EntityResolutionService, InvestigationIntelligenceService,
    KnowledgeGraphService, OfficerIntelligenceService, TimelineIntelligenceService,
    UnifiedSearchService
)

def get_intelligence_service(db: Session = Depends(get_db)) -> EntityResolutionService:
    return EntityResolutionService(db)

def get_entity_merge_service(db: Session = Depends(get_db)) -> EntityMergeService:
    return EntityMergeService(db)

def get_criminal_network_service(db: Session = Depends(get_db)) -> CriminalNetworkService:
    return CriminalNetworkService(db)

def get_cross_case_service(db: Session = Depends(get_db)) -> CrossCaseIntelligenceService:
    return CrossCaseIntelligenceService(db)

def get_knowledge_graph_service(db: Session = Depends(get_db)) -> KnowledgeGraphService:
    return KnowledgeGraphService(db)

def get_investigation_intelligence_service(db: Session = Depends(get_db)) -> InvestigationIntelligenceService:
    return InvestigationIntelligenceService(db)

def get_officer_intelligence_service(db: Session = Depends(get_db)) -> OfficerIntelligenceService:
    return OfficerIntelligenceService(db)

def get_timeline_intelligence_service(db: Session = Depends(get_db)) -> TimelineIntelligenceService:
    return TimelineIntelligenceService(db)

def get_alert_engine_service(db: Session = Depends(get_db)) -> AlertEngineService:
    return AlertEngineService(db)

def get_unified_search_service(db: Session = Depends(get_db)) -> UnifiedSearchService:
    return UnifiedSearchService(db)
