# CRMS Production Database Architecture & Migration Guide

## 1. Overview
The State Police Crime Record Management System (CRMS) database utilizes SQLAlchemy 2.0 ORM backed by PostgreSQL 15+ in production (with SQLite fallback for local development).

## 2. Core Schemas & Entity Relationships
- **Users & RBAC (`users`, `roles`, `permissions`, `role_permissions`)**: Multi-tenant authorization and role assignment.
- **Incident Registry (`crimes`)**: Primary incident records with composite indexes on `(crime_type, status)`, `(severity, is_deleted)`, and `(crime_date, status)`.
- **First Information Reports (`firs`)**: CrPC Section 154 legal document records linked 1-to-1 with Crimes.
- **Evidence Locker (`evidence`, `evidence_chain_of_custody`)**: Forensic files and immutable chain of custody audit records.
- **Offenders & Parties (`criminals`, `crime_criminals`, `victims`, `witnesses`)**: Suspect records and multi-party relationship links.
- **Intelligence Engine (`entity_resolution`, `entity_relationships`, `cross_case_links`, `cross_case_feedback`, `investigation_scores`, `officer_ai_metrics`, `timeline_analysis`, `intelligence_alerts`)**: AI graph, entity resolution, and risk tracking.
- **Audit & Notifications (`audit_logs`, `notifications`)**: Immutable action trail and user notifications.

## 3. Alembic Database Migration Workflow
Schema migrations are managed using Alembic.

### Running Migrations
```bash
cd backend
alembic upgrade head
```

### Creating New Revisions
```bash
cd backend
alembic revision --autogenerate -m "describe_schema_change"
```
