from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

class Role(Base, BaseModelMixin):
    __tablename__ = "roles"

    name = Column(String(50), unique=True, index=True, nullable=False) # e.g. Super Admin, Commissioner, Police Officer
    description = Column(String(255), nullable=True)

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", back_populates="role")

class Permission(Base, BaseModelMixin):
    __tablename__ = "permissions"

    code = Column(String(100), unique=True, index=True, nullable=False) # e.g. crime:create
    name = Column(String(100), nullable=False)
    module = Column(String(50), index=True, nullable=False) # e.g. crime, user, fir

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
