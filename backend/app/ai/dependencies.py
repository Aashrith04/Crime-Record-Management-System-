from fastapi import Depends
from sqlalchemy.orm import Session
from app.ai.service import EnterpriseAIService
from app.core.database import get_db

def get_ai_service(db: Session = Depends(get_db)) -> EnterpriseAIService:
    return EnterpriseAIService(db)
