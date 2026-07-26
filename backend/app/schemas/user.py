from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    code: str
    name: str
    module: str


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    name: str
    description: Optional[str] = None
    permissions: List[PermissionRead] = []


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    badge_number: Optional[str] = None
    rank: Optional[str] = None
    station_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role_name: str = "Police Officer"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    rank: Optional[str] = None
    station_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    is_active: bool
    created_at: datetime
    role: Optional[RoleRead] = None