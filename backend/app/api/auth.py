from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.common import StandardResponse
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=StandardResponse[UserRead])
def register_user(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    user = service.register_user(user_in, ip_address=request.client.host if request.client else None)
    return StandardResponse(
        success=True,
        message="User registered successfully.",
        data=UserRead.model_validate(user)
    )

@router.post("/login", response_model=StandardResponse[TokenResponse])
def login_user(
    credentials: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    access_token, refresh_token, _ = service.authenticate_user(
        credentials=credentials,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    return StandardResponse(
        success=True,
        message="Authentication successful.",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    )

@router.get("/me", response_model=StandardResponse[UserRead])
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return StandardResponse(
        success=True,
        message="User profile retrieved.",
        data=UserRead.model_validate(current_user)
    )

@router.post("/logout", response_model=StandardResponse[dict])
def logout_user(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        from app.core.redis import revoke_token
        revoke_token(token)

    return StandardResponse(
        success=True,
        message="Logout successful. Token invalidated.",
        data={"revoked": True}
    )

