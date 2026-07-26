from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.intelligence.dependencies import (
    get_alert_engine_service, get_criminal_network_service, get_cross_case_service,
    get_entity_merge_service, get_intelligence_service, get_investigation_intelligence_service,
    get_knowledge_graph_service, get_officer_intelligence_service, get_timeline_intelligence_service,
    get_unified_search_service
)
from app.intelligence.schemas import (
    AlertAcknowledgeRequest, CrossCaseFeedbackRequest, CrossCaseLinkRead,
    DuplicateMatch, EntityResolutionRead, IntelligenceAlertRead, IntelligenceOverviewData,
    InvestigationScoreRead, KnowledgeGraphData, MergeEntityRequest, OfficerMetricRead,
    ShortestPathResponse, TimelineAnalysisRead, UnifiedSearchQuery, UnifiedSearchResult
)
from app.intelligence.service import (
    AlertEngineService, CriminalNetworkService, CrossCaseIntelligenceService,
    EntityMergeService, EntityResolutionService, InvestigationIntelligenceService,
    KnowledgeGraphService, OfficerIntelligenceService, TimelineIntelligenceService,
    UnifiedSearchService
)
from app.models.user import User
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/intelligence", tags=["Enterprise Intelligence Suite"])

@router.get("/overview", response_model=StandardResponse[IntelligenceOverviewData])
def get_intelligence_overview(
    service: EntityResolutionService = Depends(get_intelligence_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_READ))
):
    overview = service.get_overview()
    return StandardResponse(
        success=True,
        message="Intelligence Platform metrics retrieved.",
        data=overview
    )

@router.get("/entities", response_model=StandardResponse[List[EntityResolutionRead]])
def list_resolved_entities(
    service: EntityResolutionService = Depends(get_intelligence_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_READ))
):
    entities = service.list_entities()
    return StandardResponse(
        success=True,
        message="Resolved identity records retrieved.",
        data=entities
    )

@router.get("/entities/{public_id}", response_model=StandardResponse[EntityResolutionRead])
def get_entity_detail(
    public_id: str,
    service: EntityResolutionService = Depends(get_intelligence_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_READ))
):
    entity = service.get_entity_by_id(public_id)
    return StandardResponse(
        success=True,
        message="Resolved entity record details.",
        data=entity
    )

@router.get("/duplicates", response_model=StandardResponse[List[DuplicateMatch]])
def find_potential_duplicates(
    service: EntityResolutionService = Depends(get_intelligence_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_READ))
):
    overview = service.get_overview()
    return StandardResponse(
        success=True,
        message="Potential duplicate identities detected by Entity Resolution Engine.",
        data=overview.duplicates
    )

@router.post("/merge", response_model=StandardResponse[EntityResolutionRead])
def merge_duplicate_entities(
    payload: MergeEntityRequest,
    merge_service: EntityMergeService = Depends(get_entity_merge_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_CREATE))
):
    res = merge_service.merge_entities(payload, current_user)
    return StandardResponse(
        success=True,
        message="Identity records merged successfully into canonical profile.",
        data=res
    )

@router.get("/network/{criminal_public_id}", response_model=StandardResponse[KnowledgeGraphData])
def get_criminal_network(
    criminal_public_id: str,
    network_service: CriminalNetworkService = Depends(get_criminal_network_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_READ))
):
    graph = network_service.get_network_for_criminal(criminal_public_id)
    return StandardResponse(
        success=True,
        message="Criminal Intelligence Network relationship graph generated.",
        data=graph
    )

@router.get("/cross-case", response_model=StandardResponse[List[CrossCaseLinkRead]])
def get_cross_case_intelligence(
    crime_public_id: Optional[str] = Query(None),
    cross_service: CrossCaseIntelligenceService = Depends(get_cross_case_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    links = cross_service.get_cross_case_links(crime_public_id)
    return StandardResponse(
        success=True,
        message="Cross-case investigation links and similarity analysis.",
        data=links
    )

@router.post("/cross-case/feedback", response_model=StandardResponse[Dict[str, Any]])
def submit_cross_case_feedback(
    payload: CrossCaseFeedbackRequest,
    cross_service: CrossCaseIntelligenceService = Depends(get_cross_case_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_CREATE))
):
    res = cross_service.record_feedback(payload, current_user)
    return StandardResponse(
        success=True,
        message="Investigator cross-case link feedback recorded.",
        data=res
    )

@router.get("/graph", response_model=StandardResponse[KnowledgeGraphData])
def get_enterprise_knowledge_graph(
    kg_service: KnowledgeGraphService = Depends(get_knowledge_graph_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    graph = kg_service.get_full_graph()
    return StandardResponse(
        success=True,
        message="Enterprise Knowledge Graph nodes & relationship edges.",
        data=graph
    )

@router.get("/graph/shortest-path", response_model=StandardResponse[ShortestPathResponse])
def get_graph_shortest_path(
    start_entity_id: str = Query(...),
    end_entity_id: str = Query(...),
    kg_service: KnowledgeGraphService = Depends(get_knowledge_graph_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    res = kg_service.find_shortest_path(start_entity_id, end_entity_id)
    return StandardResponse(
        success=True,
        message="Graph shortest-path connection discovery.",
        data=res
    )

# Module 5: Investigation Intelligence APIs
@router.get("/investigations/{crime_public_id}", response_model=StandardResponse[InvestigationScoreRead])
def analyze_investigation_quality(
    crime_public_id: str,
    inv_service: InvestigationIntelligenceService = Depends(get_investigation_intelligence_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    res = inv_service.analyze_investigation(crime_public_id)
    return StandardResponse(
        success=True,
        message="Investigation quality & completeness score analysis.",
        data=res
    )

# Module 6: Officer Intelligence APIs
@router.get("/officers", response_model=StandardResponse[List[OfficerMetricRead]])
def get_officer_intelligence(
    off_service: OfficerIntelligenceService = Depends(get_officer_intelligence_service),
    current_user: User = Depends(require_permissions(PermissionEnum.USER_READ))
):
    res = off_service.get_officer_metrics()
    return StandardResponse(
        success=True,
        message="Officer workload & operational efficiency analytics.",
        data=res
    )

# Module 7: Timeline Intelligence APIs
@router.get("/timeline/{crime_public_id}", response_model=StandardResponse[TimelineAnalysisRead])
def analyze_timeline_intelligence(
    crime_public_id: str,
    time_service: TimelineIntelligenceService = Depends(get_timeline_intelligence_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    res = time_service.analyze_timeline(crime_public_id)
    return StandardResponse(
        success=True,
        message="Investigation timeline chronology & anomaly analysis.",
        data=res
    )

# Module 8: Predictive Investigation Alerts APIs
@router.get("/alerts", response_model=StandardResponse[List[IntelligenceAlertRead]])
def get_predictive_alerts(
    alert_service: AlertEngineService = Depends(get_alert_engine_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    alerts = alert_service.get_alerts()
    return StandardResponse(
        success=True,
        message="Predictive investigation alerts retrieved.",
        data=alerts
    )

@router.post("/alerts/acknowledge", response_model=StandardResponse[IntelligenceAlertRead])
def acknowledge_alert(
    payload: AlertAcknowledgeRequest,
    alert_service: AlertEngineService = Depends(get_alert_engine_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_CREATE))
):
    res = alert_service.acknowledge(payload)
    return StandardResponse(
        success=True,
        message="Predictive alert status updated.",
        data=res
    )

# Module 9: Unified Intelligence Search API
@router.post("/unified-search", response_model=StandardResponse[List[UnifiedSearchResult]])
def unified_intelligence_search(
    payload: UnifiedSearchQuery,
    search_service: UnifiedSearchService = Depends(get_unified_search_service),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    res = search_service.search(payload)
    return StandardResponse(
        success=True,
        message="Unified intelligence platform search results.",
        data=res
    )
