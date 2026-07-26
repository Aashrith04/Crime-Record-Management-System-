from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.system import OfficerPerformance
from app.models.user import User
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.officer import OfficerWorkloadRead
from app.schemas.user import UserRead, UserUpdate
from app.services.audit_service import log_audit

router = APIRouter(prefix="/officers", tags=["Officer Management"])

@router.get("", response_model=PaginatedResponse[OfficerWorkloadRead])
def list_officers(
    station_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    query = db.query(User).filter(User.is_active == True)

    if station_name:
        query = query.filter(User.station_name == station_name)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            User.full_name.ilike(pattern) |
            User.badge_number.ilike(pattern) |
            User.rank.ilike(pattern)
        )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    officers = query.order_by(User.full_name.asc()).offset((page - 1) * page_size).limit(page_size).all()

    workload_items = []
    for officer in officers:
        active_count = db.query(Crime).filter(
            Crime.assigned_officer_id == officer.id,
            Crime.status.in_(["Open", "Under Investigation"]),
            Crime.is_deleted == False
        ).count()

        closed_count = db.query(Crime).filter(
            Crime.assigned_officer_id == officer.id,
            Crime.status == "Closed",
            Crime.is_deleted == False
        ).count()

        perf = db.query(OfficerPerformance).filter(OfficerPerformance.officer_id == officer.id).first()
        score = perf.performance_score if perf else 95.0

        if active_count > 10:
            avail = "Overloaded"
        elif active_count > 5:
            avail = "High Workload"
        else:
            avail = "Available"

        workload_items.append(
            OfficerWorkloadRead(
                officer=UserRead.model_validate(officer),
                active_cases_count=active_count,
                closed_cases_count=closed_count,
                performance_score=score,
                availability_status=avail
            )
        )

    return PaginatedResponse(
        success=True,
        message="Police officers workload retrieved.",
        data=PaginatedData(items=workload_items, page=page, page_size=page_size, total=total, total_pages=total_pages)
    )

@router.get("/{public_id}", response_model=StandardResponse[OfficerWorkloadRead])
def get_officer_details(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    officer = db.query(User).filter(User.public_id == public_id).first()
    if not officer:
        raise NotFoundException("Officer record not found.")

    active_count = db.query(Crime).filter(
        Crime.assigned_officer_id == officer.id,
        Crime.status.in_(["Open", "Under Investigation"]),
        Crime.is_deleted == False
    ).count()

    closed_count = db.query(Crime).filter(
        Crime.assigned_officer_id == officer.id,
        Crime.status == "Closed",
        Crime.is_deleted == False
    ).count()

    perf = db.query(OfficerPerformance).filter(OfficerPerformance.officer_id == officer.id).first()
    score = perf.performance_score if perf else 95.0

    avail = "Overloaded" if active_count > 10 else ("High Workload" if active_count > 5 else "Available")

    return StandardResponse(
        success=True,
        message="Officer details retrieved.",
        data=OfficerWorkloadRead(
            officer=UserRead.model_validate(officer),
            active_cases_count=active_count,
            closed_cases_count=closed_count,
            performance_score=score,
            availability_status=avail
        )
    )

@router.put("/{public_id}", response_model=StandardResponse[UserRead])
def update_officer_profile(
    public_id: str,
    user_in: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.USER_CREATE))
):
    officer = db.query(User).filter(User.public_id == public_id).first()
    if not officer:
        raise NotFoundException("Officer record not found.")

    for field, val in user_in.model_dump(exclude_unset=True).items():
        if field != "role_name":
            setattr(officer, field, val)

    db.commit()
    db.refresh(officer)

    log_audit(
        db=db,
        action="OFFICER_PROFILE_UPDATED",
        entity_type="User",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated officer profile for {officer.full_name}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Officer profile updated successfully.",
        data=UserRead.model_validate(officer)
    )
