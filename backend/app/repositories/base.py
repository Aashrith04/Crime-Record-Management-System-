from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id: int) -> Optional[ModelType]:
        return self.db.query(self.model).filter(
            self.model.id == id,
            getattr(self.model, "is_deleted", False) == False
        ).first()

    def get_by_public_id(self, public_id: str) -> Optional[ModelType]:
        return self.db.query(self.model).filter(
            self.model.public_id == public_id,
            getattr(self.model, "is_deleted", False) == False
        ).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None
    ) -> List[ModelType]:
        query = self.db.query(self.model)
        if hasattr(self.model, "is_deleted"):
            query = query.filter(self.model.is_deleted == False)
        
        if filters:
            for field, val in filters.items():
                if hasattr(self.model, field) and val is not None:
                    query = query.filter(getattr(self.model, field) == val)
        
        return query.offset(skip).limit(limit).all()

    def count(self, filters: Optional[dict] = None) -> int:
        query = self.db.query(func.count(self.model.id))
        if hasattr(self.model, "is_deleted"):
            query = query.filter(self.model.is_deleted == False)
        
        if filters:
            for field, val in filters.items():
                if hasattr(self.model, field) and val is not None:
                    query = query.filter(getattr(self.model, field) == val)
                    
        return query.scalar() or 0

    def create(self, obj_in: dict, created_by_id: Optional[str] = None) -> ModelType:
        if created_by_id and hasattr(self.model, "created_by"):
            obj_in["created_by"] = created_by_id
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: ModelType, obj_in: dict, updated_by_id: Optional[str] = None) -> ModelType:
        for field, value in obj_in.items():
            if value is not None and hasattr(db_obj, field):
                setattr(db_obj, field, value)
        if updated_by_id and hasattr(db_obj, "updated_by"):
            db_obj.updated_by = updated_by_id
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: ModelType, deleted_by_id: Optional[str] = None) -> bool:
        if hasattr(db_obj, "is_deleted"):
            db_obj.is_deleted = True
            if hasattr(db_obj, "is_active"):
                db_obj.is_active = False
            if deleted_by_id and hasattr(db_obj, "deleted_by"):
                db_obj.deleted_by = deleted_by_id
            self.db.commit()
            return True
        return False
