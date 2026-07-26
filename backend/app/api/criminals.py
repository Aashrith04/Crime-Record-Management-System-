from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.criminal import CrimeCriminal, Criminal
from app.models.user import User
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.criminal import CrimeCriminalLink, CriminalCreate, CriminalRead, CriminalUpdate
from app.services.audit_service import log_audit

router = APIRouter(prefix="/criminals", tags=["Criminal Profiles"])

@router.get("", response_model=PaginatedResponse[CriminalRead])
def list_criminals(
    search: Optional[str] = Query(None, description="Search by name, alias, identification marks"),
    wanted_status: Optional[str] = Query(None),
    is_deleted: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_READ))
):
    query = db.query(Criminal)
    if is_deleted is not None:
        query = query.filter(Criminal.is_deleted == is_deleted)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Criminal.full_name.ilike(pattern),
                Criminal.alias.ilike(pattern),
                Criminal.identification_marks.ilike(pattern)
            )
        )

    if wanted_status:
        query = query.filter(Criminal.wanted_status == wanted_status)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    criminals = query.order_by(Criminal.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [CriminalRead.model_validate(c) for c in criminals]

    return PaginatedResponse(
        success=True,
        message="Criminal profiles retrieved.",
        data=PaginatedData(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )
    )

@router.post("", response_model=StandardResponse[CriminalRead])
def create_criminal(
    criminal_in: CriminalCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_CREATE))
):
    criminal = Criminal(**criminal_in.model_dump())
    db.add(criminal)
    db.commit()
    db.refresh(criminal)

    log_audit(
        db=db,
        action="CRIMINAL_PROFILE_CREATED",
        entity_type="Criminal",
        entity_id=criminal.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Created profile for criminal {criminal.full_name}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Criminal profile created successfully.",
        data=CriminalRead.model_validate(criminal)
    )

@router.get("/{public_id}", response_model=StandardResponse[CriminalRead])
def get_criminal_by_id(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_READ))
):
    criminal = db.query(Criminal).filter(Criminal.public_id == public_id).first()
    if not criminal:
        raise NotFoundException("Criminal profile not found.")

    return StandardResponse(
        success=True,
        message="Criminal profile retrieved.",
        data=CriminalRead.model_validate(criminal)
    )

@router.put("/{public_id}", response_model=StandardResponse[CriminalRead])
def update_criminal(
    public_id: str,
    criminal_in: CriminalUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_UPDATE))
):
    criminal = db.query(Criminal).filter(Criminal.public_id == public_id, Criminal.is_deleted == False).first()
    if not criminal:
        raise NotFoundException("Criminal profile not found.")

    for field, value in criminal_in.model_dump(exclude_unset=True).items():
        setattr(criminal, field, value)

    db.commit()
    db.refresh(criminal)

    log_audit(
        db=db,
        action="CRIMINAL_PROFILE_UPDATED",
        entity_type="Criminal",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated profile for {criminal.full_name}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Criminal profile updated successfully.",
        data=CriminalRead.model_validate(criminal)
    )

@router.post("/{public_id}/link-crime", response_model=StandardResponse[CriminalRead])
def link_criminal_to_crime(
    public_id: str,
    link_in: CrimeCriminalLink,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_UPDATE))
):
    criminal = db.query(Criminal).filter(Criminal.public_id == public_id, Criminal.is_deleted == False).first()
    if not criminal:
        raise NotFoundException("Criminal profile not found.")

    crime = db.query(Crime).filter(Crime.id == link_in.crime_id).first()
    if not crime:
        raise NotFoundException("Crime record not found.")

    link = CrimeCriminal(
        crime_id=crime.id,
        criminal_id=criminal.id,
        role_in_crime=link_in.role_in_crime
    )
    db.add(link)
    db.commit()
    db.refresh(criminal)

    log_audit(
        db=db,
        action="CRIMINAL_LINKED_TO_CRIME",
        entity_type="Criminal",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Linked {criminal.full_name} to crime {crime.crime_number} as {link_in.role_in_crime}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message=f"Linked {criminal.full_name} to crime {crime.crime_number}.",
        data=CriminalRead.model_validate(criminal)
    )

@router.delete("/{public_id}", response_model=StandardResponse[dict])
def delete_criminal(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_DELETE))
):
    criminal = db.query(Criminal).filter(Criminal.public_id == public_id).first()
    if not criminal:
        raise NotFoundException("Criminal profile not found.")

    criminal.is_deleted = True
    criminal.deleted_at = datetime.now(timezone.utc)
    db.commit()

    log_audit(
        db=db,
        action="CRIMINAL_PROFILE_DELETED",
        entity_type="Criminal",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Deleted profile for {criminal.full_name}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Criminal profile deleted successfully.",
        data={"public_id": public_id}
    )

@router.post("/{public_id}/restore", response_model=StandardResponse[CriminalRead])
def restore_criminal(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIMINAL_DELETE))
):
    criminal = db.query(Criminal).filter(Criminal.public_id == public_id).first()
    if not criminal:
        raise NotFoundException("Criminal profile not found.")

    criminal.is_deleted = False
    criminal.deleted_at = None
    db.commit()
    db.refresh(criminal)

    log_audit(
        db=db,
        action="CRIMINAL_PROFILE_RESTORED",
        entity_type="Criminal",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Restored profile for {criminal.full_name}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Criminal profile restored successfully.",
        data=CriminalRead.model_validate(criminal)
    )
