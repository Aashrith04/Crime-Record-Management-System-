from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.user import User
from app.models.victim_witness import Victim, Witness
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.victim_witness import (
    VictimCreate, VictimRead, VictimUpdate,
    WitnessCreate, WitnessRead, WitnessUpdate
)
from app.services.audit_service import log_audit

router = APIRouter(prefix="/victims-witnesses", tags=["Victims & Witnesses"])

# --- VICTIMS ---

@router.get("/victims", response_model=PaginatedResponse[VictimRead])
def list_victims(
    crime_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_deleted: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.VICTIM_MANAGE))
):
    query = db.query(Victim)
    if is_deleted is not None:
        query = query.filter(Victim.is_deleted == is_deleted)

    if crime_id:
        query = query.filter(Victim.crime_id == crime_id)

    if search:
        pattern = f"%{search}%"
        query = query.filter(Victim.full_name.ilike(pattern))

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    victims = query.order_by(Victim.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [VictimRead.model_validate(v) for v in victims]

    return PaginatedResponse(
        success=True,
        message="Victims retrieved successfully.",
        data=PaginatedData(items=items, page=page, page_size=page_size, total=total, total_pages=total_pages)
    )

@router.post("/victims", response_model=StandardResponse[VictimRead])
def create_victim(
    victim_in: VictimCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.VICTIM_MANAGE))
):
    crime = db.query(Crime).filter(Crime.id == victim_in.crime_id).first()
    if not crime:
        raise NotFoundException("Associated crime record not found.")

    victim = Victim(**victim_in.model_dump())
    db.add(victim)
    db.commit()
    db.refresh(victim)

    log_audit(
        db=db,
        action="VICTIM_ADDED",
        entity_type="Victim",
        entity_id=victim.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Added victim {victim.full_name} to crime {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Victim record added.",
        data=VictimRead.model_validate(victim)
    )

@router.put("/victims/{public_id}", response_model=StandardResponse[VictimRead])
def update_victim(
    public_id: str,
    victim_in: VictimUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.VICTIM_MANAGE))
):
    victim = db.query(Victim).filter(Victim.public_id == public_id, Victim.is_deleted == False).first()
    if not victim:
        raise NotFoundException("Victim record not found.")

    for field, val in victim_in.model_dump(exclude_unset=True).items():
        setattr(victim, field, val)

    db.commit()
    db.refresh(victim)

    return StandardResponse(
        success=True,
        message="Victim record updated.",
        data=VictimRead.model_validate(victim)
    )

@router.delete("/victims/{public_id}", response_model=StandardResponse[dict])
def delete_victim(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.VICTIM_MANAGE))
):
    victim = db.query(Victim).filter(Victim.public_id == public_id).first()
    if not victim:
        raise NotFoundException("Victim record not found.")

    victim.is_deleted = True
    victim.deleted_at = datetime.now(timezone.utc)
    db.commit()

    return StandardResponse(
        success=True,
        message="Victim record deleted.",
        data={"public_id": public_id}
    )

@router.post("/victims/{public_id}/restore", response_model=StandardResponse[VictimRead])
def restore_victim(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.VICTIM_MANAGE))
):
    victim = db.query(Victim).filter(Victim.public_id == public_id).first()
    if not victim:
        raise NotFoundException("Victim record not found.")

    victim.is_deleted = False
    victim.deleted_at = None
    db.commit()
    db.refresh(victim)

    return StandardResponse(
        success=True,
        message="Victim record restored.",
        data=VictimRead.model_validate(victim)
    )

# --- WITNESSES ---

@router.get("/witnesses", response_model=PaginatedResponse[WitnessRead])
def list_witnesses(
    crime_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_deleted: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WITNESS_MANAGE))
):
    query = db.query(Witness)
    if is_deleted is not None:
        query = query.filter(Witness.is_deleted == is_deleted)

    if crime_id:
        query = query.filter(Witness.crime_id == crime_id)

    if search:
        pattern = f"%{search}%"
        query = query.filter(Witness.full_name.ilike(pattern))

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    witnesses = query.order_by(Witness.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [WitnessRead.model_validate(w) for w in witnesses]

    return PaginatedResponse(
        success=True,
        message="Witnesses retrieved successfully.",
        data=PaginatedData(items=items, page=page, page_size=page_size, total=total, total_pages=total_pages)
    )

@router.post("/witnesses", response_model=StandardResponse[WitnessRead])
def create_witness(
    witness_in: WitnessCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WITNESS_MANAGE))
):
    crime = db.query(Crime).filter(Crime.id == witness_in.crime_id).first()
    if not crime:
        raise NotFoundException("Associated crime record not found.")

    witness = Witness(**witness_in.model_dump())
    db.add(witness)
    db.commit()
    db.refresh(witness)

    log_audit(
        db=db,
        action="WITNESS_ADDED",
        entity_type="Witness",
        entity_id=witness.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Added witness {witness.full_name} to crime {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Witness record added.",
        data=WitnessRead.model_validate(witness)
    )

@router.put("/witnesses/{public_id}", response_model=StandardResponse[WitnessRead])
def update_witness(
    public_id: str,
    witness_in: WitnessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WITNESS_MANAGE))
):
    witness = db.query(Witness).filter(Witness.public_id == public_id, Witness.is_deleted == False).first()
    if not witness:
        raise NotFoundException("Witness record not found.")

    for field, val in witness_in.model_dump(exclude_unset=True).items():
        setattr(witness, field, val)

    db.commit()
    db.refresh(witness)

    return StandardResponse(
        success=True,
        message="Witness record updated.",
        data=WitnessRead.model_validate(witness)
    )

@router.delete("/witnesses/{public_id}", response_model=StandardResponse[dict])
def delete_witness(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WITNESS_MANAGE))
):
    witness = db.query(Witness).filter(Witness.public_id == public_id).first()
    if not witness:
        raise NotFoundException("Witness record not found.")

    witness.is_deleted = True
    witness.deleted_at = datetime.now(timezone.utc)
    db.commit()

    return StandardResponse(
        success=True,
        message="Witness record deleted.",
        data={"public_id": public_id}
    )

@router.post("/witnesses/{public_id}/restore", response_model=StandardResponse[WitnessRead])
def restore_witness(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WITNESS_MANAGE))
):
    witness = db.query(Witness).filter(Witness.public_id == public_id).first()
    if not witness:
        raise NotFoundException("Witness record not found.")

    witness.is_deleted = False
    witness.deleted_at = None
    db.commit()
    db.refresh(witness)

    return StandardResponse(
        success=True,
        message="Witness record restored.",
        data=WitnessRead.model_validate(witness)
    )
