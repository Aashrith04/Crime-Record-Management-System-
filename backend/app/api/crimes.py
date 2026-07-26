from datetime import datetime, timezone
import random
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException, BadRequestException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime, CrimeTimeline
from app.models.user import User
from app.repositories.crime_repository import CrimeRepository
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.crime import (
    CrimeAssignUpdate, CrimeCreate, CrimeFilter, CrimePriorityUpdate,
    CrimeRead, CrimeSeverityUpdate, CrimeStatusUpdate, CrimeTimelineCreate,
    CrimeTimelineRead, CrimeUpdate
)
from app.services.audit_service import log_audit

router = APIRouter(prefix="/crimes", tags=["Crime Management"])

@router.get("", response_model=PaginatedResponse[CrimeRead])
def list_crimes(
    search: Optional[str] = Query(None, description="Search by title, description, crime number, location"),
    crime_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_deleted: Optional[bool] = Query(False, description="Filter soft-deleted crime records"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    filter_params = CrimeFilter(
        search=search if isinstance(search, str) else None,
        crime_type=crime_type if isinstance(crime_type, str) else None,
        status=status if isinstance(status, str) else None,
        priority=priority if isinstance(priority, str) else None,
        severity=severity if isinstance(severity, str) else None,
        is_deleted=is_deleted if isinstance(is_deleted, bool) else False,
        page=page if isinstance(page, int) else 1,
        page_size=page_size if isinstance(page_size, int) else 10,
        sort_by=sort_by if isinstance(sort_by, str) else "created_at",
        sort_order=sort_order if isinstance(sort_order, str) else "desc"
    )
    repo = CrimeRepository(db)
    items, total = repo.filter_crimes(filter_params)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    items_read = [CrimeRead.model_validate(item) for item in items]

    return PaginatedResponse(
        success=True,
        message="Crimes retrieved successfully.",
        data=PaginatedData(
            items=items_read,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )
    )

@router.post("", response_model=StandardResponse[CrimeRead])
def create_crime(
    crime_in: CrimeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_CREATE))
):
    repo = CrimeRepository(db)
    crime_num = f"CR-2026-{random.randint(1000, 9999)}"

    crime_dict = crime_in.model_dump()
    crime_dict["crime_number"] = crime_num

    crime = repo.create(crime_dict, created_by_id=current_user.public_id)

    timeline = CrimeTimeline(
        crime_id=crime.id,
        title="Crime Registered",
        description=f"Crime record {crime.crime_number} registered into CRMS system by {current_user.full_name}.",
        event_timestamp=crime.created_at,
        performed_by_id=current_user.id
    )
    db.add(timeline)
    db.commit()
    db.refresh(crime)

    log_audit(
        db=db,
        action="CRIME_CREATED",
        entity_type="Crime",
        entity_id=crime.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Created crime record {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Crime registered successfully.",
        data=CrimeRead.model_validate(crime)
    )

@router.get("/{public_id}", response_model=StandardResponse[CrimeRead])
def get_crime_by_public_id(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    return StandardResponse(
        success=True,
        message="Crime record retrieved.",
        data=CrimeRead.model_validate(crime)
    )

@router.put("/{public_id}", response_model=StandardResponse[CrimeRead])
def update_crime(
    public_id: str,
    crime_in: CrimeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_UPDATE))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    updated_crime = repo.update(crime, crime_in.model_dump(exclude_unset=True), updated_by_id=current_user.public_id)

    log_audit(
        db=db,
        action="CRIME_UPDATED",
        entity_type="Crime",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated crime details for {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Crime record updated successfully.",
        data=CrimeRead.model_validate(updated_crime)
    )

@router.patch("/{public_id}/status", response_model=StandardResponse[CrimeRead])
def update_crime_status(
    public_id: str,
    status_in: CrimeStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_UPDATE))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    old_status = crime.status
    crime.status = status_in.status
    db.commit()

    timeline = CrimeTimeline(
        crime_id=crime.id,
        title="Status Updated",
        description=f"Status changed from '{old_status}' to '{status_in.status}' by {current_user.full_name}.",
        event_timestamp=datetime.now(timezone.utc),
        performed_by_id=current_user.id
    )
    db.add(timeline)
    db.commit()
    db.refresh(crime)

    log_audit(
        db=db,
        action="CRIME_STATUS_UPDATED",
        entity_type="Crime",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Changed status of {crime.crime_number} to {status_in.status}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message=f"Status updated to {status_in.status}.",
        data=CrimeRead.model_validate(crime)
    )

@router.patch("/{public_id}/priority", response_model=StandardResponse[CrimeRead])
def update_crime_priority(
    public_id: str,
    priority_in: CrimePriorityUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_UPDATE))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    crime.priority = priority_in.priority
    db.commit()
    db.refresh(crime)

    return StandardResponse(
        success=True,
        message=f"Priority updated to {priority_in.priority}.",
        data=CrimeRead.model_validate(crime)
    )

@router.patch("/{public_id}/severity", response_model=StandardResponse[CrimeRead])
def update_crime_severity(
    public_id: str,
    severity_in: CrimeSeverityUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_UPDATE))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    crime.severity = severity_in.severity
    db.commit()
    db.refresh(crime)

    return StandardResponse(
        success=True,
        message=f"Severity updated to {severity_in.severity}.",
        data=CrimeRead.model_validate(crime)
    )

@router.post("/{public_id}/assign", response_model=StandardResponse[CrimeRead])
def assign_crime_officer(
    public_id: str,
    assign_in: CrimeAssignUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_ASSIGN))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    officer = db.query(User).filter(User.id == assign_in.assigned_officer_id).first()
    if not officer:
        raise NotFoundException("Assigned officer not found.")

    crime.assigned_officer_id = officer.id
    db.commit()

    timeline = CrimeTimeline(
        crime_id=crime.id,
        title="Officer Assigned",
        description=f"Crime assigned to Officer {officer.full_name} ({officer.rank or 'Officer'}) by {current_user.full_name}.",
        event_timestamp=datetime.now(timezone.utc),
        performed_by_id=current_user.id
    )
    db.add(timeline)
    db.commit()
    db.refresh(crime)

    log_audit(
        db=db,
        action="CRIME_OFFICER_ASSIGNED",
        entity_type="Crime",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Assigned crime {crime.crime_number} to officer {officer.full_name}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message=f"Assigned to {officer.full_name}.",
        data=CrimeRead.model_validate(crime)
    )

@router.post("/{public_id}/timeline", response_model=StandardResponse[CrimeTimelineRead])
def add_timeline_entry(
    public_id: str,
    timeline_in: CrimeTimelineCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_UPDATE))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    entry = CrimeTimeline(
        crime_id=crime.id,
        title=timeline_in.title,
        description=timeline_in.description,
        event_timestamp=timeline_in.event_timestamp or datetime.now(timezone.utc),
        performed_by_id=current_user.id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return StandardResponse(
        success=True,
        message="Timeline entry added.",
        data=CrimeTimelineRead.model_validate(entry)
    )

@router.delete("/{public_id}", response_model=StandardResponse[dict])
def soft_delete_crime(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_DELETE))
):
    repo = CrimeRepository(db)
    crime = repo.get_by_public_id(public_id)
    if not crime:
        raise NotFoundException("Crime record not found.")

    repo.soft_delete(crime, deleted_by_id=current_user.public_id)

    log_audit(
        db=db,
        action="CRIME_DELETED",
        entity_type="Crime",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Soft deleted crime record {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Crime record soft-deleted successfully.",
        data={"public_id": public_id}
    )

@router.post("/{public_id}/restore", response_model=StandardResponse[CrimeRead])
def restore_crime(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_DELETE))
):
    crime = db.query(Crime).filter(Crime.public_id == public_id).first()
    if not crime:
        raise NotFoundException("Crime record not found.")

    crime.is_deleted = False
    crime.deleted_at = None
    db.commit()
    db.refresh(crime)

    log_audit(
        db=db,
        action="CRIME_RESTORED",
        entity_type="Crime",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Restored crime record {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Crime record restored successfully.",
        data=CrimeRead.model_validate(crime)
    )
