from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import get_db
from app.core.exceptions import NotFoundException, BadRequestException
from app.dependencies.auth_deps import get_current_user, require_permissions
from app.models.crime import Crime
from app.models.criminal import Criminal
from app.models.evidence import Evidence, EvidenceChainOfCustody
from app.models.fir import FIR
from app.models.investigation import Investigation
from app.models.user import User
from app.models.victim_witness import Victim, Witness
from app.services.pdf_service import generate_generic_report_pdf, generate_fir_pdf

router = APIRouter(prefix="/reports", tags=["Professional PDF Reports"])

@router.get("/pdf/{report_type}")
def generate_pdf_report(
    report_type: str,
    public_id: Optional[str] = Query(None, description="Public ID for single entity report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rtype = report_type.lower()
    
    if rtype == "fir" and public_id:
        fir = db.query(FIR).filter(FIR.public_id == public_id).first()
        if not fir:
            raise NotFoundException("FIR not found.")
        pdf_bytes = generate_fir_pdf(fir)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={fir.fir_number}.pdf"})

    if rtype == "crime":
        crimes = db.query(Crime).filter(Crime.is_deleted == False).limit(50).all()
        headers = ["Crime Number", "Title", "Category", "Severity", "Status", "Location"]
        rows = [[c.crime_number, c.title, c.crime_type, c.severity, c.status, c.location_name] for c in crimes]
        pdf_bytes = generate_generic_report_pdf("Crime Incident Registry Report", headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Crime_Incident_Report.pdf"})

    elif rtype == "evidence":
        evidences = db.query(Evidence).filter(Evidence.is_deleted == False).limit(50).all()
        headers = ["Evidence #", "File Name", "Media Type", "Vault Location", "Status", "Barcode"]
        rows = [[e.evidence_number, e.file_name, e.file_type, e.storage_location, e.status, e.barcode or "N/A"] for e in evidences]
        pdf_bytes = generate_generic_report_pdf("Digital & Forensic Evidence Report", headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Evidence_Locker_Report.pdf"})

    elif rtype == "investigation":
        invs = db.query(Investigation).filter(Investigation.is_deleted == False).limit(50).all()
        headers = ["Case ID", "Crime Ref", "Status", "Summary"]
        rows = [[f"CASE-INV-#{inv.id}", inv.crime.crime_number if inv.crime else "N/A", inv.status, inv.summary or "N/A"] for inv in invs]
        pdf_bytes = generate_generic_report_pdf("Case Investigation Log Report", headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Investigation_Report.pdf"})

    elif rtype == "officer":
        officers = db.query(User).filter(User.is_active == True).limit(50).all()
        headers = ["Officer Name", "Badge #", "Rank", "Police Station", "Email"]
        rows = [[u.full_name, u.badge_number or "N/A", u.rank or "Officer", u.station_name or "HQ", u.email] for u in officers]
        pdf_bytes = generate_generic_report_pdf("Police Department Roster Report", headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Police_Roster_Report.pdf"})

    elif rtype == "victim":
        victims = db.query(Victim).filter(Victim.is_deleted == False).limit(50).all()
        headers = ["Victim Name", "Contact", "Address", "Statement"]
        rows = [[v.full_name, v.contact or "N/A", v.address or "N/A", v.statement or "N/A"] for v in victims]
        pdf_bytes = generate_generic_report_pdf("Victims Protection Registry Report", headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Victims_Report.pdf"})

    elif rtype == "witness":
        witnesses = db.query(Witness).filter(Witness.is_deleted == False).limit(50).all()
        headers = ["Witness Name", "Protected Status", "Contact Phone", "Statement Log"]
        rows = [[w.full_name, "PROTECTED" if w.is_protected else "Standard", w.contact or "Shielded", w.statement or "Recorded"] for w in witnesses]
        pdf_bytes = generate_generic_report_pdf("Witness Statements & Protection Report", headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Witness_Report.pdf"})

    elif rtype == "custody":
        logs = db.query(EvidenceChainOfCustody).limit(50).all()
        headers = ["Evidence Ref", "Action", "From", "To", "Approval", "Handled By"]
        rows = [[f"EVD-#{c.evidence_id}", c.action, c.moved_from or "N/A", c.moved_to or "N/A", c.approval_status, c.handled_by.full_name if c.handled_by else "Officer"] for c in logs]
        pdf_bytes = generate_generic_report_pdf("Chain of Custody Transfer Report", headers, rows)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Chain_Of_Custody_Report.pdf"})

    else:
        raise BadRequestException(f"Unsupported report type '{report_type}'. Supported: crime, fir, evidence, investigation, officer, victim, witness, custody")
