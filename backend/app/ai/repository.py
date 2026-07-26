from typing import List, Optional
from sqlalchemy.orm import Session
from app.ai.models import AIChatHistory, FIRSummary, OCRDocument, SemanticVectorIndex

class AIRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_chat_history(self, user_id: int, limit: int = 20) -> List[AIChatHistory]:
        return self.db.query(AIChatHistory).filter(
            AIChatHistory.user_id == user_id
        ).order_by(AIChatHistory.created_at.desc()).limit(limit).all()

    def get_fir_summary(self, fir_id: int) -> Optional[FIRSummary]:
        return self.db.query(FIRSummary).filter(FIRSummary.fir_id == fir_id).first()

    def get_ocr_documents(self, limit: int = 20) -> List[OCRDocument]:
        return self.db.query(OCRDocument).order_by(OCRDocument.created_at.desc()).limit(limit).all()

    def get_total_ai_queries_count(self) -> int:
        return self.db.query(AIChatHistory).count()
