from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.system import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogRead
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse

router = APIRouter(prefix="/logs", tags=["Audit Logs"])

@router.get("", response_model=PaginatedResponse[AuditLogRead])
def list_audit_logs(
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.AUDIT_LOG_VIEW))
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(pattern),
                AuditLog.user_email.ilike(pattern),
                AuditLog.details.ilike(pattern),
                AuditLog.ip_address.ilike(pattern)
            )
        )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [AuditLogRead.model_validate(l) for l in logs]

    return PaginatedResponse(
        success=True,
        message="Audit logs retrieved.",
        data=PaginatedData(items=items, page=page, page_size=page_size, total=total, total_pages=total_pages)
    )
