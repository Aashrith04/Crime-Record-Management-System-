from typing import List, Callable
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.redis import is_token_revoked
from app.core.security import decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if is_token_revoked(token):
        raise UnauthorizedException("Token has been revoked.")

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired access token.")

    user_public_id = payload.get("sub")
    if not user_public_id:
        raise UnauthorizedException("Malformed token payload.")

    user_repo = UserRepository(db)
    user = user_repo.get_by_public_id_with_permissions(user_public_id)

    if not user or not user.is_active or user.is_deleted:
        raise UnauthorizedException("User account is disabled or does not exist.")

    return user

def require_permissions(*required_permissions: str) -> Callable:
    def permission_dependency(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.role or not current_user.role.permissions:
            raise ForbiddenException("User role has no granted permissions.")

        user_permission_codes = {p.code for p in current_user.role.permissions}

        # Check if all required permissions are present
        for perm in required_permissions:
            if perm not in user_permission_codes:
                raise ForbiddenException(f"Permission denied. Required permission: '{perm}'")

        return current_user

    return permission_dependency
