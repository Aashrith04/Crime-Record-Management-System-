from fastapi import APIRouter
from app.ai.router import router as ai_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.crimes import router as crimes_router
from app.api.criminals import router as criminals_router
from app.api.evidences import router as evidences_router
from app.api.export import router as export_router
from app.api.firs import router as firs_router
from app.api.investigations import router as investigations_router
from app.api.logs import router as logs_router
from app.api.map import router as map_router
from app.api.notifications import router as notifications_router
from app.api.officers import router as officers_router
from app.api.reports import router as reports_router
from app.api.search import router as search_router
from app.api.settings import router as settings_router
from app.api.uploads import router as uploads_router
from app.api.victims_witnesses import router as victims_witnesses_router

from app.intelligence.router import router as intelligence_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(crimes_router)
api_router.include_router(firs_router)
api_router.include_router(criminals_router)
api_router.include_router(victims_witnesses_router)
api_router.include_router(evidences_router)
api_router.include_router(investigations_router)
api_router.include_router(officers_router)
api_router.include_router(map_router)
api_router.include_router(ai_router)
api_router.include_router(intelligence_router)
api_router.include_router(analytics_router)
api_router.include_router(logs_router)
api_router.include_router(uploads_router)
api_router.include_router(search_router)
api_router.include_router(notifications_router)
api_router.include_router(settings_router)
api_router.include_router(reports_router)
api_router.include_router(export_router)
