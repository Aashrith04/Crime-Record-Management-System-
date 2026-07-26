import os
import random
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.evidence import Evidence, EvidenceChainOfCustody
from app.models.user import User
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.evidence import (
    EvidenceChainOfCustodyCreate, EvidenceChainOfCustodyRead,
    EvidenceCreate, EvidenceRead, EvidenceUpdate
)
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification, notify_all_users

router = APIRouter(prefix="/evidences", tags=["Evidence Locker"])

@router.get("", response_model=PaginatedResponse[EvidenceRead])
def list_evidences(
    crime_id: Optional[int] = Query(None),
    file_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_deleted: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_READ))
):
    query = db.query(Evidence)
    if is_deleted is not None:
        query = query.filter(Evidence.is_deleted == is_deleted)

    if crime_id:
        query = query.filter(Evidence.crime_id == crime_id)

    if file_type:
        query = query.filter(Evidence.file_type == file_type)

    if status:
        query = query.filter(Evidence.status == status)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Evidence.file_name.ilike(pattern),
                Evidence.evidence_number.ilike(pattern),
                Evidence.barcode.ilike(pattern),
                Evidence.description.ilike(pattern),
                Evidence.storage_location.ilike(pattern)
            )
        )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    evidences = query.order_by(Evidence.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [EvidenceRead.model_validate(e) for e in evidences]

    return PaginatedResponse(
        success=True,
        message="Evidence records retrieved.",
        data=PaginatedData(items=items, page=page, page_size=page_size, total=total, total_pages=total_pages)
    )

@router.post("", response_model=StandardResponse[EvidenceRead])
def upload_evidence(
    evidence_in: EvidenceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_UPLOAD))
):
    crime = db.query(Crime).filter(Crime.id == evidence_in.crime_id).first()
    if not crime:
        raise NotFoundException("Associated crime record not found.")

    evidence_num = f"EVD-2026-{random.randint(1000, 9999)}"
    barcode_num = f"BC-CRMS-{random.randint(100000, 999999)}"

    evidence_dict = evidence_in.model_dump()
    evidence_dict["evidence_number"] = evidence_num
    evidence_dict["barcode"] = evidence_in.barcode or barcode_num
    evidence_dict["uploaded_by_id"] = current_user.id

    evidence = Evidence(**evidence_dict)
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    # Initial Chain of Custody Entry
    custody_entry = EvidenceChainOfCustody(
        evidence_id=evidence.id,
        action="Checked In",
        moved_from="Crime Scene / Submission",
        moved_to=evidence.storage_location,
        notes=f"Initial evidence upload by {current_user.full_name}.",
        handled_by_id=current_user.id
    )
    db.add(custody_entry)
    db.commit()
    db.refresh(evidence)

    log_audit(
        db=db,
        action="EVIDENCE_UPLOADED",
        entity_type="Evidence",
        entity_id=evidence.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Uploaded evidence {evidence.evidence_number} for crime {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Evidence item registered in Evidence Locker.",
        data=EvidenceRead.model_validate(evidence)
    )

@router.post("/upload-file", response_model=StandardResponse[EvidenceRead])
async def upload_evidence_file(
    request: Request,
    crime_id: int = Form(...),
    file_name: str = Form(...),
    file_type: str = Form("image"),
    description: Optional[str] = Form(None),
    storage_location: str = Form("Central Vault Locker A-1"),
    file: Optional[UploadFile] = File(None),
    file_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_UPLOAD))
):
    crime = db.query(Crime).filter(Crime.id == crime_id).first()
    if not crime:
        raise NotFoundException("Associated crime record not found.")

    final_url = file_url or "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600"
    
    if file and file.filename:
        UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        base_url = str(request.base_url).rstrip("/")
        final_url = f"{base_url}/static/uploads/{unique_filename}"
        if not file_name:
            file_name = file.filename

    evidence_num = f"EVD-2026-{random.randint(1000, 9999)}"
    barcode_num = f"BC-CRMS-{random.randint(100000, 999999)}"

    evidence = Evidence(
        crime_id=crime.id,
        evidence_number=evidence_num,
        file_name=file_name,
        file_type=file_type,
        file_url=final_url,
        description=description,
        storage_location=storage_location,
        barcode=barcode_num,
        status="In Locker",
        uploaded_by_id=current_user.id
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    custody_entry = EvidenceChainOfCustody(
        evidence_id=evidence.id,
        action="Checked In",
        moved_from="Crime Scene / Submission",
        moved_to=storage_location,
        notes=f"Initial evidence upload by {current_user.full_name}.",
        handled_by_id=current_user.id
    )
    db.add(custody_entry)
    db.commit()
    db.refresh(evidence)

    notify_all_users(
        db=db,
        title=f"Evidence Secured: {evidence.evidence_number}",
        message=f"New evidence file '{evidence.file_name}' uploaded for crime incident {crime.crime_number}.",
        notification_type="EVIDENCE_UPLOADED",
        link="/evidence"
    )

    log_audit(
        db=db,
        action="EVIDENCE_UPLOADED",
        entity_type="Evidence",
        entity_id=evidence.public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Uploaded evidence {evidence.evidence_number} for crime {crime.crime_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Evidence file uploaded and secured in Evidence Locker.",
        data=EvidenceRead.model_validate(evidence)
    )

@router.get("/{public_id}", response_model=StandardResponse[EvidenceRead])
def get_evidence_by_id(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_READ))
):
    evidence = db.query(Evidence).filter(Evidence.public_id == public_id).first()
    if not evidence:
        raise NotFoundException("Evidence record not found.")

    return StandardResponse(
        success=True,
        message="Evidence item retrieved.",
        data=EvidenceRead.model_validate(evidence)
    )

@router.put("/{public_id}", response_model=StandardResponse[EvidenceRead])
def update_evidence(
    public_id: str,
    evidence_in: EvidenceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_UPLOAD))
):
    evidence = db.query(Evidence).filter(Evidence.public_id == public_id, Evidence.is_deleted == False).first()
    if not evidence:
        raise NotFoundException("Evidence record not found.")

    for field, val in evidence_in.model_dump(exclude_unset=True).items():
        setattr(evidence, field, val)

    db.commit()
    db.refresh(evidence)

    log_audit(
        db=db,
        action="EVIDENCE_UPDATED",
        entity_type="Evidence",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated evidence item {evidence.evidence_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Evidence item updated.",
        data=EvidenceRead.model_validate(evidence)
    )

@router.post("/{public_id}/custody-move", response_model=StandardResponse[EvidenceRead])
def move_evidence_custody(
    public_id: str,
    custody_in: EvidenceChainOfCustodyCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_UPLOAD))
):
    evidence = db.query(Evidence).filter(Evidence.public_id == public_id, Evidence.is_deleted == False).first()
    if not evidence:
        raise NotFoundException("Evidence record not found.")

    entry = EvidenceChainOfCustody(
        evidence_id=evidence.id,
        action=custody_in.action,
        moved_from=custody_in.moved_from or evidence.storage_location,
        moved_to=custody_in.moved_to or evidence.storage_location,
        notes=custody_in.notes,
        handled_by_id=current_user.id
    )
    if custody_in.moved_to:
        evidence.storage_location = custody_in.moved_to

    db.add(entry)
    db.commit()
    db.refresh(evidence)

    if evidence.crime and evidence.crime.assigned_officer_id:
        create_notification(
            db=db,
            user_id=evidence.crime.assigned_officer_id,
            title="Evidence Custody Transferred",
            message=f"Evidence {evidence.evidence_number} moved: {custody_in.action} to {custody_in.moved_to}",
            notification_type="EVIDENCE_TRANSFERRED",
            link="/evidence"
        )

    log_audit(
        db=db,
        action="EVIDENCE_CUSTODY_MOVED",
        entity_type="Evidence",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Evidence {evidence.evidence_number} moved: {custody_in.action}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Chain of custody record updated.",
        data=EvidenceRead.model_validate(evidence)
    )

@router.post("/{public_id}/replace-file", response_model=StandardResponse[EvidenceRead])
async def replace_evidence_file(
    public_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_UPLOAD))
):
    evidence = db.query(Evidence).filter(Evidence.public_id == public_id, Evidence.is_deleted == False).first()
    if not evidence:
        raise NotFoundException("Evidence record not found.")

    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}_v{evidence.version + 1}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    base_url = str(request.base_url).rstrip("/")
    new_url = f"{base_url}/static/uploads/{unique_filename}"

    # Update versioning
    import json
    history = json.loads(evidence.version_history or "[]")
    history.append({
        "version": evidence.version,
        "file_name": evidence.file_name,
        "file_url": evidence.file_url,
        "replaced_at": datetime.now(timezone.utc).isoformat(),
        "replaced_by": current_user.full_name
    })

    evidence.file_url = new_url
    evidence.file_name = file.filename
    evidence.version += 1
    evidence.version_history = json.dumps(history)

    custody_entry = EvidenceChainOfCustody(
        evidence_id=evidence.id,
        action=f"File Replaced (v{evidence.version})",
        moved_from=evidence.storage_location,
        moved_to=evidence.storage_location,
        notes=f"Replaced with updated file {file.filename} by {current_user.full_name}.",
        handled_by_id=current_user.id
    )
    db.add(custody_entry)
    db.commit()
    db.refresh(evidence)

    return StandardResponse(
        success=True,
        message=f"Evidence file updated to version v{evidence.version}.",
        data=EvidenceRead.model_validate(evidence)
    )

@router.delete("/{public_id}", response_model=StandardResponse[dict])
def delete_evidence(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_UPLOAD))
):
    evidence = db.query(Evidence).filter(Evidence.public_id == public_id).first()
    if not evidence:
        raise NotFoundException("Evidence record not found.")

    evidence.is_deleted = True
    evidence.deleted_at = datetime.now(timezone.utc)
    db.commit()

    log_audit(
        db=db,
        action="EVIDENCE_DELETED",
        entity_type="Evidence",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Deleted evidence item {evidence.evidence_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Evidence item deleted from locker.",
        data={"public_id": public_id}
    )

@router.post("/{public_id}/restore", response_model=StandardResponse[EvidenceRead])
def restore_evidence(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.EVIDENCE_UPLOAD))
):
    evidence = db.query(Evidence).filter(Evidence.public_id == public_id).first()
    if not evidence:
        raise NotFoundException("Evidence record not found.")

    evidence.is_deleted = False
    evidence.deleted_at = None
    db.commit()
    db.refresh(evidence)

    log_audit(
        db=db,
        action="EVIDENCE_RESTORED",
        entity_type="Evidence",
        entity_id=public_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Restored evidence item {evidence.evidence_number}",
        ip_address=request.client.host if request.client else None
    )

    return StandardResponse(
        success=True,
        message="Evidence item restored successfully.",
        data=EvidenceRead.model_validate(evidence)
    )
