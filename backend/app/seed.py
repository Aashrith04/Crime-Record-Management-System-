from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.constants.permissions import PermissionEnum
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.crime import Crime, CrimeTimeline
from app.models.criminal import Criminal, CrimeCriminal
from app.models.evidence import Evidence, EvidenceChainOfCustody
from app.models.fir import FIR
from app.models.rbac import Permission, Role
from app.models.user import User

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print("Seeding permissions...")
        all_permissions = []
        for perm in PermissionEnum:
            code = perm.value
            module = code.split(":")[0]
            name = code.replace(":", " ").title()
            existing = db.query(Permission).filter(Permission.code == code).first()
            if not existing:
                p = Permission(code=code, name=name, module=module)
                db.add(p)
                all_permissions.append(p)
            else:
                all_permissions.append(existing)
        db.commit()

        print("Seeding roles...")
        roles_def = {
            "Super Admin": [p.value for p in PermissionEnum],
            "Commissioner": [
                PermissionEnum.CRIME_READ.value,
                PermissionEnum.FIR_READ.value,
                PermissionEnum.CRIMINAL_READ.value,
                PermissionEnum.EVIDENCE_READ.value,
                PermissionEnum.INVESTIGATION_READ.value,
                PermissionEnum.ANALYTICS_VIEW.value,
                PermissionEnum.REPORT_GENERATE.value,
                PermissionEnum.AI_ASSISTANT_USE.value,
                PermissionEnum.AUDIT_LOG_VIEW.value
            ],
            "Station Admin": [
                PermissionEnum.USER_READ.value,
                PermissionEnum.USER_CREATE.value,
                PermissionEnum.CRIME_READ.value,
                PermissionEnum.CRIME_CREATE.value,
                PermissionEnum.CRIME_UPDATE.value,
                PermissionEnum.CRIME_ASSIGN.value,
                PermissionEnum.FIR_READ.value,
                PermissionEnum.FIR_CREATE.value,
                PermissionEnum.FIR_APPROVE.value,
                PermissionEnum.CRIMINAL_READ.value,
                PermissionEnum.CRIMINAL_CREATE.value,
                PermissionEnum.EVIDENCE_READ.value,
                PermissionEnum.EVIDENCE_UPLOAD.value,
                PermissionEnum.INVESTIGATION_READ.value,
                PermissionEnum.ANALYTICS_VIEW.value,
                PermissionEnum.AI_ASSISTANT_USE.value
            ],
            "Police Officer": [
                PermissionEnum.CRIME_READ.value,
                PermissionEnum.CRIME_CREATE.value,
                PermissionEnum.CRIME_UPDATE.value,
                PermissionEnum.FIR_READ.value,
                PermissionEnum.FIR_CREATE.value,
                PermissionEnum.CRIMINAL_READ.value,
                PermissionEnum.VICTIM_MANAGE.value,
                PermissionEnum.WITNESS_MANAGE.value,
                PermissionEnum.EVIDENCE_READ.value,
                PermissionEnum.EVIDENCE_UPLOAD.value,
                PermissionEnum.AI_ASSISTANT_USE.value
            ],
            "Investigator": [
                PermissionEnum.CRIME_READ.value,
                PermissionEnum.FIR_READ.value,
                PermissionEnum.CRIMINAL_READ.value,
                PermissionEnum.CRIMINAL_UPDATE.value,
                PermissionEnum.EVIDENCE_READ.value,
                PermissionEnum.EVIDENCE_UPLOAD.value,
                PermissionEnum.INVESTIGATION_READ.value,
                PermissionEnum.INVESTIGATION_UPDATE.value,
                PermissionEnum.CASE_DIARY_ADD.value,
                PermissionEnum.AI_ASSISTANT_USE.value
            ],
            "Data Entry Operator": [
                PermissionEnum.CRIME_READ.value,
                PermissionEnum.CRIME_CREATE.value,
                PermissionEnum.FIR_READ.value,
                PermissionEnum.FIR_CREATE.value,
                PermissionEnum.CRIMINAL_READ.value,
                PermissionEnum.CRIMINAL_CREATE.value,
                PermissionEnum.VICTIM_MANAGE.value,
                PermissionEnum.WITNESS_MANAGE.value
            ]
        }

        created_roles = {}
        for role_name, perm_codes in roles_def.items():
            r = db.query(Role).filter(Role.name == role_name).first()
            if not r:
                r = Role(name=role_name, description=f"Enterprise {role_name} System Role")
                db.add(r)
                db.commit()
                db.refresh(r)

            perms = db.query(Permission).filter(Permission.code.in_(perm_codes)).all()
            r.permissions = perms
            db.commit()
            created_roles[role_name] = r

        print("Seeding initial Super Admin user...")
        admin = db.query(User).filter(User.email == "admin@police.gov.in").first()
        if not admin:
            admin = User(
                email="admin@police.gov.in",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="Chief Administrator",
                badge_number="IND-POL-001",
                rank="Director General of Police",
                station_name="Police Headquarters",
                role_id=created_roles["Super Admin"].id
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        print("Seeding sample Crime records, FIRs, Evidences, & Offender profiles...")
        sample_crimes = [
            {
                "crime_number": "CR-2026-1001",
                "title": "Armed Jewellery Store Robbery",
                "crime_type": "Robbery",
                "description": "Two armed individuals breached the main vault of Royal Jewellers at 14:30. Stole gold ornaments valued at approx 45 Lakhs.",
                "crime_date": datetime.now(timezone.utc),
                "location_name": "MG Road Commercial Hub, Sector 4",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "priority": "Critical",
                "severity": "Critical",
                "status": "Under Investigation",
                "assigned_officer_id": admin.id,
                "is_deleted": False
            },
            {
                "crime_number": "CR-2026-1002",
                "title": "Corporate Phishing Cyber Fraud",
                "crime_type": "Cybercrime",
                "description": "Unauthorized transfer of company payroll funds via spoofed banking portal link.",
                "crime_date": datetime.now(timezone.utc),
                "location_name": "Cyber Park IT Towers, Tech Zone",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "priority": "High",
                "severity": "Severe",
                "status": "Open",
                "assigned_officer_id": admin.id,
                "is_deleted": False
            }
        ]

        for c_data in sample_crimes:
            existing_c = db.query(Crime).filter(Crime.crime_number == c_data["crime_number"]).first()
            if not existing_c:
                crime = Crime(**c_data)
                db.add(crime)
                db.commit()
                db.refresh(crime)

                fir = FIR(
                    fir_number=f"FIR-2026-{crime.crime_number.split('-')[-1]}",
                    crime_id=crime.id,
                    complainant_name="Store Manager / Witness",
                    complainant_contact="+91 9876543210",
                    complainant_address="Sector 4 Commercial Plaza",
                    incident_details=crime.description,
                    sections_of_law="IPC Section 392, 397 (Armed Robbery)",
                    status="Registered",
                    registered_at=datetime.now(timezone.utc),
                    is_deleted=False
                )
                db.add(fir)

                timeline = CrimeTimeline(
                    crime_id=crime.id,
                    title="Initial FIR Registered",
                    description=f"FIR registered and assigned to {admin.full_name}",
                    event_timestamp=datetime.now(timezone.utc),
                    performed_by_id=admin.id
                )
                db.add(timeline)

                evidence = Evidence(
                    crime_id=crime.id,
                    evidence_number=f"EVD-2026-901{crime.id}",
                    file_name=f"CrimeScene_Footage_{crime.crime_number}.mp4",
                    file_type="video",
                    file_url="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600",
                    description=f"High definition CCTV capture for incident {crime.crime_number}",
                    storage_location="Vault Locker A-1",
                    barcode=f"BC-CRMS-90100{crime.id}",
                    status="In Locker",
                    uploaded_by_id=admin.id,
                    is_deleted=False
                )
                db.add(evidence)
                db.commit()

                custody = EvidenceChainOfCustody(
                    evidence_id=evidence.id,
                    action="Checked In",
                    moved_from="Crime Scene",
                    moved_to="Vault Locker A-1",
                    notes="Sealed evidence bag transferred from scene investigator.",
                    handled_by_id=admin.id
                )
                db.add(custody)
                db.commit()

        # Seed Sample Criminal Profile if none exists
        if db.query(Criminal).count() == 0:
            criminal = Criminal(
                full_name="Vikram 'The Viper' Singh",
                alias="Viper",
                photo_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                gender="Male",
                address="Outer Ring Road, Sector 9",
                identification_marks="Tattoo of cobra on right forearm",
                wanted_status="Wanted",
                is_deleted=False
            )
            db.add(criminal)
            db.commit()

        print("Database seed complete!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
