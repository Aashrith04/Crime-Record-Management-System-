from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.user import User
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/map", tags=["GIS Crime Map"])

@router.get("/crimes", response_model=StandardResponse[dict])
def get_map_crimes(
    crime_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CRIME_READ))
):
    query = db.query(Crime).filter(
        or_(Crime.is_deleted == False, Crime.is_deleted == None),
        Crime.latitude.isnot(None),
        Crime.longitude.isnot(None)
    )

    if crime_type and isinstance(crime_type, str):
        query = query.filter(Crime.crime_type == crime_type)

    if severity and isinstance(severity, str):
        query = query.filter(Crime.severity == severity)

    if status and isinstance(status, str):
        query = query.filter(Crime.status == status)

    crimes = query.all()

    features = []
    seen_ids = set()

    for c in crimes:
        if c.id in seen_ids:
            continue
        seen_ids.add(c.id)

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c.longitude, c.latitude]
            },
            "properties": {
                "id": c.id,
                "public_id": c.public_id,
                "crime_number": c.crime_number,
                "title": c.title,
                "crime_type": c.crime_type,
                "severity": c.severity,
                "priority": c.priority,
                "status": c.status,
                "location_name": c.location_name,
                "crime_date": c.crime_date.isoformat() if c.crime_date else None
            }
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    return StandardResponse(
        success=True,
        message="GIS crime spatial data retrieved.",
        data=geojson
    )
