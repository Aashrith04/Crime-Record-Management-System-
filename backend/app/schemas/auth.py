from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserSessionInfo(BaseModel):
    public_id: str
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    last_activity: str
