import json
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.system import SystemSettings
from app.models.user import User
from app.schemas.common import StandardResponse
from app.schemas.settings import DepartmentSettingsData

router = APIRouter(prefix="/settings", tags=["Settings Module"])

DEFAULT_CRIME_CATEGORIES = ["Robbery", "Cybercrime", "Assault", "Theft", "Homicide", "Narcotics", "White Collar Fraud", "Kidnapping"]
DEFAULT_EVIDENCE_CATEGORIES = ["Image", "Video", "PDF Document", "Audio Recording", "Forensic Sample", "Weapon / Physical Object"]
DEFAULT_RANKS = ["Director General of Police", "Commissioner of Police", "Superintendent of Police", "Inspector of Police", "Sub-Inspector", "Senior Constable"]
DEFAULT_POLICE_STATIONS = ["Police Headquarters", "Central Precinct", "Metro Station", "North Sector Station", "East Suburb Police Station", "Cybercrime Cell"]
DEFAULT_STORAGE_LOCATIONS = ["Central Vault Locker A-1", "Central Vault Locker B-2", "Forensic Lab Vault 3", "Court Evidence Custody Box 1"]
DEFAULT_PRIORITIES = ["Low", "Medium", "High", "Critical"]

@router.get("", response_model=StandardResponse[DepartmentSettingsData])
def get_department_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    setting_row = db.query(SystemSettings).filter(SystemSettings.key == "department_config").first()
    if setting_row and setting_row.value:
        try:
            data_dict = json.loads(setting_row.value)
            return StandardResponse(
                success=True,
                message="Department settings retrieved.",
                data=DepartmentSettingsData(**data_dict)
            )
        except Exception:
            pass

    default_data = DepartmentSettingsData(
        crime_categories=DEFAULT_CRIME_CATEGORIES,
        evidence_categories=DEFAULT_EVIDENCE_CATEGORIES,
        ranks=DEFAULT_RANKS,
        police_stations=DEFAULT_POLICE_STATIONS,
        storage_locations=DEFAULT_STORAGE_LOCATIONS,
        case_priorities=DEFAULT_PRIORITIES,
        theme="dark"
    )

    return StandardResponse(
        success=True,
        message="Default department settings retrieved.",
        data=default_data
    )

@router.put("", response_model=StandardResponse[DepartmentSettingsData])
def update_department_settings(
    settings_in: DepartmentSettingsData,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.USER_CREATE))
):
    setting_row = db.query(SystemSettings).filter(SystemSettings.key == "department_config").first()
    json_str = json.dumps(settings_in.model_dump())

    if not setting_row:
        setting_row = SystemSettings(
            key="department_config",
            value=json_str,
            category="Department",
            description="Enterprise Crime Record Management System Settings"
        )
        db.add(setting_row)
    else:
        setting_row.value = json_str

    db.commit()

    return StandardResponse(
        success=True,
        message="Department settings updated successfully.",
        data=settings_in
    )
