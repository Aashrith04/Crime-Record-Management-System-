from typing import Optional
from sqlalchemy.orm import Session
from app.models.system import Notification
from app.models.user import User

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "INFO",
    link: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def notify_all_users(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "INFO",
    link: Optional[str] = None
):
    users = db.query(User).filter(User.is_active == True).all()
    for u in users:
        notif = Notification(
            user_id=u.id,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link,
            is_read=False
        )
        db.add(notif)
    db.commit()
