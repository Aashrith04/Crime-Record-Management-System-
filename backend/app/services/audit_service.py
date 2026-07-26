from typing import Optional
from sqlalchemy.orm import Session
from app.models.system import AuditLog

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        try:
            log_entry = AuditLog(
                user_id=user_id,
                user_email=user_email,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else None,
                details=details,
                ip_address=ip_address
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to record audit log: {e}")

def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    AuditService.log_action(
        db=db,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        user_email=user_email,
        details=details,
        ip_address=ip_address
    )
