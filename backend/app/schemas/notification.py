from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str = "INFO"
    link: Optional[str] = None
