from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.criminal import Criminal
from app.models.evidence import Evidence
from app.models.fir import FIR
from app.models.user import User
from app.models.victim_witness import Victim, Witness
from app.schemas.common import PaginatedData, PaginatedResponse, StandardResponse
from app.schemas.search import GlobalSearchResponseData, SearchResultItem

router = APIRouter(prefix="/search", tags=["Global Advanced Search"])

def active_filter(model):
    return or_(model.is_deleted == False, model.is_deleted == None)

@router.get("", response_model=StandardResponse[GlobalSearchResponseData])
def global_search(
    q: str = Query(..., min_length=1, description="Global search query"),
    category: str = Query("all", description="Entity category filter: all, crimes, firs, criminals, victims, witnesses, evidence, officers"),
    status: Optional[str] = Query(None),
    crime_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results: List[SearchResultItem] = []
    pattern = f"%{q}%"

    # 1. Search Crimes
    if category in ("all", "crimes"):
        c_query = db.query(Crime).filter(active_filter(Crime))
        c_query = c_query.filter(
            or_(
                Crime.title.ilike(pattern),
                Crime.crime_number.ilike(pattern),
                Crime.description.ilike(pattern),
                Crime.location_name.ilike(pattern),
                Crime.crime_type.ilike(pattern)
            )
        )
        if status:
            c_query = c_query.filter(Crime.status == status)
        if crime_type:
            c_query = c_query.filter(Crime.crime_type == crime_type)

        for c in c_query.limit(20).all():
            results.append(
                SearchResultItem(
                    entity_type="Crime",
                    title=c.title,
                    subtitle=f"{c.crime_number} • {c.location_name}",
                    public_id=c.public_id,
                    detail_url=f"/crimes/{c.public_id}",
                    badge_text=c.severity,
                    badge_color="rose" if c.severity == "Critical" else "cyan",
                    created_at=c.created_at.strftime("%Y-%m-%d"),
                    metadata={"status": c.status, "crime_type": c.crime_type}
                )
            )

    # 2. Search FIRs
    if category in ("all", "firs"):
        f_query = db.query(FIR).filter(active_filter(FIR))
        f_query = f_query.filter(
            or_(
                FIR.fir_number.ilike(pattern),
                FIR.complainant_name.ilike(pattern),
                FIR.complainant_contact.ilike(pattern),
                FIR.sections_of_law.ilike(pattern),
                FIR.incident_details.ilike(pattern)
            )
        )
        for f in f_query.limit(20).all():
            results.append(
                SearchResultItem(
                    entity_type="FIR",
                    title=f"FIR {f.fir_number} - {f.complainant_name}",
                    subtitle=f"IPC: {f.sections_of_law}",
                    public_id=f.public_id,
                    detail_url="/firs",
                    badge_text=f.status,
                    badge_color="amber",
                    created_at=f.registered_at.strftime("%Y-%m-%d"),
                    metadata={"complainant": f.complainant_name}
                )
            )

    # 3. Search Criminals
    if category in ("all", "criminals"):
        cr_query = db.query(Criminal).filter(active_filter(Criminal))
        cr_query = cr_query.filter(
            or_(
                Criminal.full_name.ilike(pattern),
                Criminal.alias.ilike(pattern),
                Criminal.identification_marks.ilike(pattern),
                Criminal.address.ilike(pattern)
            )
        )
        for cr in cr_query.limit(20).all():
            results.append(
                SearchResultItem(
                    entity_type="Criminal",
                    title=cr.full_name,
                    subtitle=f"Alias: {cr.alias or 'N/A'} • Marks: {cr.identification_marks or 'N/A'}",
                    public_id=cr.public_id,
                    detail_url="/criminals",
                    badge_text=cr.wanted_status,
                    badge_color="rose" if cr.wanted_status == "Wanted" else "emerald",
                    created_at=cr.created_at.strftime("%Y-%m-%d"),
                    metadata={"wanted_status": cr.wanted_status}
                )
            )

    # 4. Search Evidence
    if category in ("all", "evidence"):
        ev_query = db.query(Evidence).filter(active_filter(Evidence))
        ev_query = ev_query.filter(
            or_(
                Evidence.evidence_number.ilike(pattern),
                Evidence.barcode.ilike(pattern),
                Evidence.file_name.ilike(pattern),
                Evidence.storage_location.ilike(pattern),
                Evidence.description.ilike(pattern)
            )
        )
        for ev in ev_query.limit(20).all():
            results.append(
                SearchResultItem(
                    entity_type="Evidence",
                    title=f"{ev.evidence_number} - {ev.file_name}",
                    subtitle=f"Vault: {ev.storage_location} • Barcode: {ev.barcode or 'N/A'}",
                    public_id=ev.public_id,
                    detail_url="/evidence",
                    badge_text=ev.status,
                    badge_color="cyan",
                    created_at=ev.created_at.strftime("%Y-%m-%d"),
                    metadata={"file_type": ev.file_type}
                )
            )

    # 5. Search Victims
    if category in ("all", "victims"):
        v_query = db.query(Victim).filter(active_filter(Victim)).filter(
            or_(Victim.full_name.ilike(pattern), Victim.contact.ilike(pattern), Victim.address.ilike(pattern))
        )
        for v in v_query.limit(10).all():
            results.append(
                SearchResultItem(
                    entity_type="Victim",
                    title=v.full_name,
                    subtitle=f"Contact: {v.contact or 'N/A'}",
                    public_id=v.public_id,
                    detail_url="/victims-witnesses",
                    badge_text="Victim",
                    badge_color="amber",
                    created_at=v.created_at.strftime("%Y-%m-%d"),
                    metadata={}
                )
            )

    # 6. Search Witnesses
    if category in ("all", "witnesses"):
        w_query = db.query(Witness).filter(active_filter(Witness)).filter(
            or_(Witness.full_name.ilike(pattern), Witness.contact.ilike(pattern))
        )
        for w in w_query.limit(10).all():
            results.append(
                SearchResultItem(
                    entity_type="Witness",
                    title=w.full_name,
                    subtitle=f"Protected: {'Yes' if w.is_protected else 'No'}",
                    public_id=w.public_id,
                    detail_url="/victims-witnesses",
                    badge_text="Protected Witness" if w.is_protected else "Witness",
                    badge_color="amber" if w.is_protected else "cyan",
                    created_at=w.created_at.strftime("%Y-%m-%d"),
                    metadata={"is_protected": w.is_protected}
                )
            )

    # 7. Search Officers
    if category in ("all", "officers"):
        o_query = db.query(User).filter(
            or_(User.full_name.ilike(pattern), User.badge_number.ilike(pattern), User.rank.ilike(pattern), User.station_name.ilike(pattern))
        )
        for o in o_query.limit(10).all():
            results.append(
                SearchResultItem(
                    entity_type="Officer",
                    title=o.full_name,
                    subtitle=f"Badge: {o.badge_number or 'N/A'} • {o.rank or 'Officer'} ({o.station_name or 'HQ'})",
                    public_id=o.public_id,
                    detail_url="/officers",
                    badge_text=o.rank or "Officer",
                    badge_color="blue",
                    created_at=o.created_at.strftime("%Y-%m-%d"),
                    metadata={"badge": o.badge_number}
                )
            )

    total = len(results)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    start_idx = (page - 1) * page_size
    paginated_items = results[start_idx:start_idx + page_size]

    suggestions = [
        "Armed Robbery", "Cyber Park", "EVD-2026", "FIR-2026", "Viper", "MG Road"
    ]

    return StandardResponse(
        success=True,
        message="Enterprise search results returned.",
        data=GlobalSearchResponseData(
            items=paginated_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            suggestions=suggestions
        )
    )
