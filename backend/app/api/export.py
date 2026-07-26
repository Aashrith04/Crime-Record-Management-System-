import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import BadRequestException
from app.dependencies.auth_deps import get_current_user
from app.models.crime import Crime
from app.models.criminal import Criminal
from app.models.evidence import Evidence
from app.models.fir import FIR
from app.models.investigation import Investigation
from app.models.user import User
from app.models.victim_witness import Victim, Witness
from app.services.pdf_service import generate_generic_report_pdf

router = APIRouter(prefix="/export", tags=["Universal Data Export"])

def active_filter(model):
    from sqlalchemy import or_
    return or_(model.is_deleted == False, model.is_deleted == None)

@router.get("/{entity}")
def export_table_data(
    entity: str,
    format: str = Query("csv", description="Export format: csv, excel, pdf"),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ent = entity.lower()
    headers = []
    rows = []
    title = f"{ent.title()} Export"

    if ent == "crimes":
        query = db.query(Crime).filter(active_filter(Crime))
        if status:
            query = query.filter(Crime.status == status)
        headers = ["Crime Number", "Title", "Crime Type", "Severity", "Priority", "Status", "Location", "Date"]
        rows = [[c.crime_number, c.title, c.crime_type, c.severity, c.priority, c.status, c.location_name, c.created_at.strftime("%Y-%m-%d")] for c in query.all()]

    elif ent == "firs":
        query = db.query(FIR).filter(active_filter(FIR))
        if status:
            query = query.filter(FIR.status == status)
        headers = ["FIR Number", "Complainant", "Contact", "Sections of Law", "Status", "Registered Date"]
        rows = [[f.fir_number, f.complainant_name, f.complainant_contact, f.sections_of_law, f.status, f.registered_at.strftime("%Y-%m-%d")] for f in query.all()]

    elif ent == "criminals":
        query = db.query(Criminal).filter(active_filter(Criminal))
        headers = ["Offender Name", "Alias", "Gender", "Wanted Status", "Identification Marks", "Address"]
        rows = [[c.full_name, c.alias or "N/A", c.gender or "N/A", c.wanted_status, c.identification_marks or "N/A", c.address or "N/A"] for c in query.all()]

    elif ent == "evidences":
        query = db.query(Evidence).filter(active_filter(Evidence))
        headers = ["Evidence #", "File Name", "Media Type", "Vault Location", "Status", "Barcode"]
        rows = [[e.evidence_number, e.file_name, e.file_type, e.storage_location, e.status, e.barcode or "N/A"] for e in query.all()]

    elif ent == "officers":
        query = db.query(User).filter(User.is_active == True)
        headers = ["Name", "Badge #", "Rank", "Police Station", "Email"]
        rows = [[u.full_name, u.badge_number or "N/A", u.rank or "Officer", u.station_name or "HQ", u.email] for u in query.all()]

    elif ent == "investigations":
        query = db.query(Investigation).filter(active_filter(Investigation))
        headers = ["Case ID", "Status", "Summary", "Started Date"]
        rows = [[f"CASE-INV-#{inv.id}", inv.status, inv.summary or "N/A", inv.started_at.strftime("%Y-%m-%d")] for inv in query.all()]

    else:
        raise BadRequestException(f"Unsupported entity '{entity}'. Supported: crimes, firs, criminals, evidences, officers, investigations")

    if format.lower() == "pdf":
        pdf_bytes = generate_generic_report_pdf(title, headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={ent}_export.pdf"})

    # CSV / Excel Format (TSV/CSV text output)
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=',' if format.lower() == "csv" else '\t')
    writer.writerow(headers)
    for r in rows:
        writer.writerow(r)

    content = buffer.getvalue()
    media_type = "text/csv" if format.lower() == "csv" else "application/vnd.ms-excel"
    ext = "csv" if format.lower() == "csv" else "xls"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={ent}_export.{ext}"}
    )
