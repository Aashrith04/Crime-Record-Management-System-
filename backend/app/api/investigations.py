from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.investigation import CaseDiary, Investigation
from app.models.user import User
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.investigation import (
    CaseDiaryCreate, CaseDiaryRead,
    InvestigationCreate, InvestigationRead, InvestigationUpdate
)
from app.services.audit_service import log_audit

router = APIRouter(prefix="/investigations", tags=["Investigation Module"])

@router.get("", response_model=PaginatedResponse[InvestigationRead])
def list_investigations(
    status: Optional[str] = Query(None),
    is_deleted: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.INVESTIGATION_READ))
):
    query = db.query(Investigation)
    if is_deleted is not None:
        query = query.filter(Investigation.is_deleted == is_deleted)

    if status:
        query = query.filter(Investigation.status == status)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    investigations = query.order_by(Investigation.started_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [InvestigationRead.model_validate(inv) for inv in investigations]

    return PaginatedResponse(
        success=True,
        message="Investigations retrieved successfully.",
        data=PaginatedData(items=items, page=page, page_size=page_size, total=total, total_pages=total_pages)
    )

@router.post("", response_model=StandardResponse[InvestigationRead])
def create_investigation(
    inv_in: InvestigationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.INVESTIGATION_UPDATE))
):
    crime = db.query(Crime).filter(Crime.id == inv_in.crime_id).first()
    if not crime:
        raise NotFoundException("Associated crime record not found.")

    existing = db.query(Investigation).filter(Investigation.crime_id == crime.id).first()
    if existing:
        return StandardResponse(
            success=True,
            message="Investigation already exists for this crime.",
            data=InvestigationRead.model_validate(existing)
        )

    inv = Investigation(**inv_in.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)

    log_audit(
        db=db,
        action="INVESTIGATION_CREATED",
        entity_type="Investigation",
        entity_id=inv.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Opened investigation for crime {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Investigation record initialized.",
        data=InvestigationRead.model_validate(inv)
    )

@router.get("/{public_id}", response_model=StandardResponse[InvestigationRead])
def get_investigation(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.INVESTIGATION_READ))
):
    inv = db.query(Investigation).filter(Investigation.public_id == public_id).first()
    if not inv:
        raise NotFoundException("Investigation record not found.")

    return StandardResponse(
        success=True,
        message="Investigation record retrieved.",
        data=InvestigationRead.model_validate(inv)
    )

@router.put("/{public_id}", response_model=StandardResponse[InvestigationRead])
def update_investigation(
    public_id: str,
    inv_in: InvestigationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.INVESTIGATION_UPDATE))
):
    inv = db.query(Investigation).filter(Investigation.public_id == public_id, Investigation.is_deleted == False).first()
    if not inv:
        raise NotFoundException("Investigation record not found.")

    for field, val in inv_in.model_dump(exclude_unset=True).items():
        setattr(inv, field, val)

    db.commit()
    db.refresh(inv)

    log_audit(
        db=db,
        action="INVESTIGATION_UPDATED",
        entity_type="Investigation",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated investigation status to {inv.status}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Investigation details updated.",
        data=InvestigationRead.model_validate(inv)
    )

@router.post("/{public_id}/case-diaries", response_model=StandardResponse[CaseDiaryRead])
def add_case_diary_entry(
    public_id: str,
    diary_in: CaseDiaryCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CASE_DIARY_ADD))
):
    inv = db.query(Investigation).filter(Investigation.public_id == public_id, Investigation.is_deleted == False).first()
    if not inv:
        raise NotFoundException("Investigation record not found.")

    entry = CaseDiary(
        investigation_id=inv.id,
        notes=diary_in.notes,
        entry_date=diary_in.entry_date or datetime.now(timezone.utc),
        author_id=current_user.id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    log_audit(
        db=db,
        action="CASE_DIARY_ENTRY_ADDED",
        entity_type="CaseDiary",
        entity_id=entry.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Added Case Diary entry for investigation #{inv.id}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Case Diary entry logged successfully.",
        data=CaseDiaryRead.model_validate(entry)
    )

@router.delete("/{public_id}", response_model=StandardResponse[dict])
def delete_investigation(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.INVESTIGATION_UPDATE))
):
    inv = db.query(Investigation).filter(Investigation.public_id == public_id).first()
    if not inv:
        raise NotFoundException("Investigation record not found.")

    inv.is_deleted = True
    inv.deleted_at = datetime.now(timezone.utc)
    db.commit()

    log_audit(
        db=db,
        action="INVESTIGATION_DELETED",
        entity_type="Investigation",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Deleted investigation #{inv.id}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Investigation record deleted.",
        data={"public_id": public_id}
    )

@router.post("/{public_id}/restore", response_model=StandardResponse[InvestigationRead])
def restore_investigation(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.INVESTIGATION_UPDATE))
):
    inv = db.query(Investigation).filter(Investigation.public_id == public_id).first()
    if not inv:
        raise NotFoundException("Investigation record not found.")

    inv.is_deleted = False
    inv.deleted_at = None
    db.commit()
    db.refresh(inv)

    log_audit(
        db=db,
        action="INVESTIGATION_RESTORED",
        entity_type="Investigation",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Restored investigation #{inv.id}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Investigation record restored.",
        data=InvestigationRead.model_validate(inv)
    )
