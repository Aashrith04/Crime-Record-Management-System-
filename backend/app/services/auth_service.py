from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.models.rbac import Role
from app.models.user import RefreshToken, User, UserSession
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate
from app.services.audit_service import AuditService

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register_user(self, user_in: UserCreate, ip_address: Optional[str] = None) -> User:
        existing = self.user_repo.get_by_email(user_in.email)
        if existing:
            raise BadRequestException("A user with this email address already exists.")

        role = self.db.query(Role).filter(Role.name == user_in.role_name).first()
        if not role:
            role = self.db.query(Role).filter(Role.name == "Police Officer").first()

        try:
            user_data = {
                "email": user_in.email,
                "hashed_password": get_password_hash(user_in.password),
                "full_name": user_in.full_name,
                "badge_number": user_in.badge_number,
                "rank": user_in.rank,
                "station_name": user_in.station_name,
                "phone_number": user_in.phone_number,
                "avatar_url": user_in.avatar_url,
                "role_id": role.id if role else None
            }

            user = self.user_repo.create(user_data)
            AuditService.log_action(
                self.db,
                action="USER_REGISTERED",
                entity_type="User",
                entity_id=user.public_id,
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address
            )
            return user
        except Exception as e:
            self.db.rollback()
            raise BadRequestException(f"Failed to register user account: {str(e)}")

    def authenticate_user(self, credentials: LoginRequest, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Tuple[str, str, User]:
        user = self.user_repo.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise UnauthorizedException("Invalid email credentials or password.")

        if not user.is_active or user.is_deleted:
            raise UnauthorizedException("User account is disabled or revoked. Contact Station Admin.")

        try:
            access_token = create_access_token(subject=user.public_id)
            refresh_token = create_refresh_token(subject=user.public_id)

            # Store Refresh Token in DB
            refresh_db = RefreshToken(
                token=refresh_token,
                user_id=user.id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            )
            self.db.add(refresh_db)

            # Create User Session
            session = UserSession(
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                device_info=user_agent[:100] if user_agent else "Unknown Device"
            )
            self.db.add(session)
            self.db.commit()

            AuditService.log_action(
                self.db,
                action="USER_LOGIN",
                entity_type="User",
                entity_id=user.public_id,
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address
            )

            return access_token, refresh_token, user
        except Exception as e:
            self.db.rollback()
            raise BadRequestException(f"Authentication processing error: {str(e)}")
