import json
import uuid
from typing import Any, Dict
from sqlalchemy.orm import Session
from app.ai.models import AIChatHistory
from app.ai.rag import RAGPipeline
from app.ai.schemas import AIChatRequest, AIChatResponseData
from app.models.user import User

class AIAssistantManager:
    def __init__(self, db: Session):
        self.db = db
        self.rag = RAGPipeline(db)

    def process_chat(self, req: AIChatRequest, user: User) -> AIChatResponseData:
        cid = req.conversation_id or str(uuid.uuid4())
        res = self.rag.execute(req.prompt, cid, user)

        # Store History in DB
        history_entry = AIChatHistory(
            conversation_id=cid,
            user_id=user.id,
            prompt=req.prompt,
            response=res.answer,
            provider=res.confidence.provider,
            latency_ms=res.confidence.processing_time_ms,
            confidence_score=res.confidence.confidence_percentage,
            references_json=json.dumps(res.referenced_records)
        )
        self.db.add(history_entry)
        self.db.commit()

        return res
