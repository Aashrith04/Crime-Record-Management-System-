from typing import Optional
from sqlalchemy.orm import Session
from app.services.audit_service import log_audit

class AIAuditLogger:
    @staticmethod
    def log_ai_execution(
        db: Session,
        user_id: int,
        user_email: str,
        action: str,
        prompt: str,
        provider: str,
        latency_ms: float,
        errors: Optional[str] = None
    ):
        # Clean prompt for audit safety (remove secrets if any)
        safe_prompt = prompt[:200]
        details = f"Provider: {provider} | Latency: {latency_ms}ms | Prompt: {safe_prompt}"
        if errors:
            details += f" | Errors: {errors}"

        log_audit(
            db=db,
            action=f"AI_{action.upper()}",
            entity_type="AI_Module",
            entity_id=None,
            user_id=user_id,
            user_email=user_email,
            details=details,
            ip_address=None
        )
