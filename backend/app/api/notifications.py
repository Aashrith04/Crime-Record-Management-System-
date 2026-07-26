from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.dependencies.auth_deps import get_current_user
from app.models.system import Notification
from app.models.user import User
from app.schemas.common import StandardResponse
from app.schemas.notification import NotificationRead

router = APIRouter(prefix="/notifications", tags=["Notification Module"])

@router.get("", response_model=StandardResponse[dict])
def get_user_notifications(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(limit).all()

    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    items = [NotificationRead.model_validate(n) for n in notifs]

    return StandardResponse(
        success=True,
        message="Notifications retrieved.",
        data={
            "items": items,
            "unread_count": unread_count
        }
    )

@router.get("/unread-count", response_model=StandardResponse[dict])
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return StandardResponse(
        success=True,
        message="Unread notification count.",
        data={"unread_count": unread_count}
    )

@router.patch("/{notification_id}/read", response_model=StandardResponse[NotificationRead])
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise NotFoundException("Notification not found.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)

    return StandardResponse(
        success=True,
        message="Notification marked as read.",
        data=NotificationRead.model_validate(notif)
    )

@router.post("/read-all", response_model=StandardResponse[dict])
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()

    return StandardResponse(
        success=True,
        message="All notifications marked as read.",
        data={"user_id": current_user.id}
    )
