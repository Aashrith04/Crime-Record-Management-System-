from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).options(
            joinedload(User.role)
        ).filter(
            User.email == email,
            User.is_deleted == False
        ).first()

    def get_by_public_id_with_permissions(self, public_id: str) -> Optional[User]:
        return self.db.query(User).options(
            joinedload(User.role)
        ).filter(
            User.public_id == public_id,
            User.is_deleted == False
        ).first()
