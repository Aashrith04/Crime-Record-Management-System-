from datetime import datetime, timezone
import random
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException, BadRequestException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime, CrimeTimeline
from app.models.fir import FIR
from app.models.user import User
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.fir import FIRCreate, FIRRead, FIRUpdate
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification, notify_all_users
from app.services.pdf_service import generate_fir_pdf

router = APIRouter(prefix="/firs", tags=["FIR Management"])

def active_filter(model):
    return or_(model.is_deleted == False, model.is_deleted == None)

@router.get("", response_model=PaginatedResponse[FIRRead])
def list_firs(
    search: Optional[str] = Query(None, description="Search complainant name, FIR number, IPC sections"),
    status: Optional[str] = Query(None),
    is_deleted: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.FIR_READ))
):
    query = db.query(FIR)
    if is_deleted is not None:
        if is_deleted:
            query = query.filter(FIR.is_deleted == True)
        else:
            query = query.filter(active_filter(FIR))

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                FIR.fir_number.ilike(pattern),
                FIR.complainant_name.ilike(pattern),
                FIR.sections_of_law.ilike(pattern),
                FIR.incident_details.ilike(pattern)
            )
        )

    if status:
        query = query.filter(FIR.status == status)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    firs = query.order_by(FIR.registered_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [FIRRead.model_validate(f) for f in firs]

    return PaginatedResponse(
        success=True,
        message="FIR records retrieved successfully.",
        data=PaginatedData(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )
    )

@router.post("", response_model=StandardResponse[FIRRead])
def register_fir(
    fir_in: FIRCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.FIR_CREATE))
):
    crime = db.query(Crime).filter(Crime.id == fir_in.crime_id, active_filter(Crime)).first()
    if not crime:
        raise NotFoundException("Associated crime record not found.")

    existing_fir = db.query(FIR).filter(FIR.crime_id == fir_in.crime_id, active_filter(FIR)).first()
    if existing_fir:
        raise BadRequestException(f"A First Information Report ({existing_fir.fir_number}) is already registered for this crime incident.")

    fir_num = f"FIR-2026-{random.randint(1000, 9999)}"
    fir_dict = fir_in.model_dump()
    fir_dict["fir_number"] = fir_num
    fir_dict["registered_at"] = datetime.now(timezone.utc)

    fir = FIR(**fir_dict)
    db.add(fir)
    db.commit()
    db.refresh(fir)

    # Log Crime Timeline
    timeline = CrimeTimeline(
        crime_id=crime.id,
        title="FIR Registered",
        description=f"First Information Report {fir.fir_number} filed under {fir.sections_of_law}.",
        event_timestamp=datetime.now(timezone.utc),
        performed_by_id=current_user.id
    )
    db.add(timeline)
    db.commit()

    # Trigger Notification
    notify_all_users(
        db=db,
        title=f"New FIR Registered: {fir.fir_number}",
        message=f"FIR registered for crime {crime.crime_number} ({crime.title}).",
        notification_type="FIR_REGISTERED",
        link="/firs"
    )

    log_audit(
        db=db,
        action="FIR_REGISTERED",
        entity_type="FIR",
        entity_id=fir.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Registered FIR {fir.fir_number} for crime {crime.crime_number}",
        ip_address=request.client.host if (request and request.client) else None
    )

    return StandardResponse(
        success=True,
        message="FIR registered successfully.",
        data=FIRRead.model_validate(fir)
    )

@router.get("/{public_id}", response_model=StandardResponse[FIRRead])
def get_fir_by_public_id(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.FIR_READ))
):
    fir = db.query(FIR).filter(FIR.public_id == public_id).first()
    if not fir:
        raise NotFoundException("FIR record not found.")

    return StandardResponse(
        success=True,
        message="FIR record retrieved.",
        data=FIRRead.model_validate(fir)
    )

@router.put("/{public_id}", response_model=StandardResponse[FIRRead])
def update_fir(
    public_id: str,
    fir_in: FIRUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.FIR_UPDATE))
):
    fir = db.query(FIR).filter(FIR.public_id == public_id, active_filter(FIR)).first()
    if not fir:
        raise NotFoundException("FIR record not found.")

    for field, value in fir_in.model_dump(exclude_unset=True).items():
        setattr(fir, field, value)

    db.commit()
    db.refresh(fir)

    log_audit(
        db=db,
        action="FIR_UPDATED",
        entity_type="FIR",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated FIR {fir.fir_number}",
        ip_address=request.client.host if (request and request.client) else None
    )

    return StandardResponse(
        success=True,
        message="FIR updated successfully.",
        data=FIRRead.model_validate(fir)
    )

@router.get("/{public_id}/pdf")
def download_fir_pdf(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.FIR_READ))
):
    fir = db.query(FIR).filter(FIR.public_id == public_id).first()
    if not fir:
        raise NotFoundException("FIR record not found.")

    pdf_bytes = generate_fir_pdf(fir)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={fir.fir_number}.pdf"
        }
    )

@router.delete("/{public_id}", response_model=StandardResponse[dict])
def delete_fir(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.FIR_DELETE))
):
    fir = db.query(FIR).filter(FIR.public_id == public_id).first()
    if not fir:
        raise NotFoundException("FIR record not found.")

    fir.is_deleted = True
    fir.deleted_at = datetime.now(timezone.utc)
    db.commit()

    log_audit(
        db=db,
        action="FIR_DELETED",
        entity_type="FIR",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Deleted FIR {fir.fir_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="FIR record deleted successfully.",
        data={"public_id": public_id}
    )

@router.post("/{public_id}/restore", response_model=StandardResponse[FIRRead])
def restore_fir(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.FIR_DELETE))
):
    fir = db.query(FIR).filter(FIR.public_id == public_id).first()
    if not fir:
        raise NotFoundException("FIR record not found.")

    fir.is_deleted = False
    fir.deleted_at = None
    db.commit()
    db.refresh(fir)

    log_audit(
        db=db,
        action="FIR_RESTORED",
        entity_type="FIR",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Restored FIR {fir.fir_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="FIR record restored successfully.",
        data=FIRRead.model_validate(fir)
    )
