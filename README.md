# Enterprise Crime Record Management System (CRMS)

[![CI/CD Pipeline](https://github.com/police-dept/crms/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/police-dept/crms/actions)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-000000.svg?style=flat&logo=Next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.0-336791.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D.svg?style=flat&logo=Redis&logoColor=white)](https://redis.io)

An enterprise-grade, secure, and production-ready **Crime Record Management System (CRMS)** built for state police departments and law enforcement agencies.

---

## 🏛️ System Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   Next.js 14 Web Portal     │
                          │ (TypeScript, React Query)   │
                          └──────────────┬──────────────┘
                                         │ HTTPS / REST API
                                         ▼
                          ┌─────────────────────────────┐
                          │    FastAPI Gateway v1       │
                          │ (JWT Auth, RBAC, Security)  │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
    ┌────────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐
    │  PostgreSQL Database   │ │ Redis Cache Store │ │ Server File Storage  │
    │  (Crimes, FIRs, Evid)  │ │ (Session / PubSub)│ │ (Vault Media Uploads)│
    └────────────────────────┘ └───────────────────┘ └──────────────────────┘
```

---

## 🚀 Key Modules & Features

1. **Authentication & RBAC**: JWT Access & Refresh Tokens, 6 Granular System Roles (`Super Admin`, `Commissioner`, `Station Admin`, `Police Officer`, `Investigator`, `Data Entry`).
2. **Crime Incident Registry**: Complete incident management, priority levels, severity metrics, and soft delete/restore.
3. **Automated FIR Generator**: CrPC Section 154 compliance, duplicate FIR prevention, automatic PDF compilation, and crime timeline entries.
4. **Digital & Forensic Evidence Locker**: Multipart file uploads, image/video/PDF media previews, version tracking (`v1` → `v2`), replace file capability, and barcode management.
5. **Chain of Custody**: Immutable evidence movement tracking, handled officer timestamps, and digital signature hashes.
6. **Real-Time Notification System**: Notification bell popover, unread counter badges, and automated system event broadcasts.
7. **Global Enterprise Search**: Cross-module search indexing Crimes, FIRs, Evidence, Criminals, Victims, Witnesses, and Officers.
8. **Officer Workspace**: Personalized officer dashboard displaying assigned active cases, pending chargesheets, completed cases, and court deadlines.
9. **GIS Spatial Crime Map**: Dynamic Leaflet spatial mapping with color-coded severity icons, popups, and coordinate filtering.
10. **Executive Analytics & PDF Exports**: Real-time KPI metrics, monthly trend charts, station performance tables, and ReportLab PDF document compilation.

---

## 🐳 Quick Start with Docker Compose (Production)

The system includes a production-ready multi-container orchestration set up with `docker-compose.yml`.

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+

### Deployment Command
```bash
# Clone repository
git clone https://github.com/police-dept/crms.git
cd crms

# Spin up PostgreSQL, Redis, FastAPI Backend, and Next.js Frontend
docker-compose up -d --build
```

Access services at:
- **Web Portal**: `http://localhost:3000`
- **REST API Docs**: `http://localhost:8000/docs`
- **API Health Check**: `http://localhost:8000/health`

---

## ⚙️ Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: .\venv\Scripts\activate | On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# Run initial database seed
python -m app.seed

# Start FastAPI development server
python -m app.main
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security & Compliance

- **Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`.
- **JWT Cryptography**: Algorithm `HS256`, configurable expiration parameters.
- **Audit Logging**: Every critical data modification is logged to `audit_logs` table with user ID, action, timestamp, and IP address.
- **File Upload Safeguards**: MIME type validation, max size enforcement, and safe file name sanitization.

---

## 🧪 Automated Testing & CI/CD

```bash
# Run backend pytest suite
cd backend
pytest tests/

# Run frontend TypeScript typecheck
cd frontend
npx tsc --noEmit
```

GitHub Actions automatically executes pytest, TypeScript typechecking, and Next.js production builds on every push to `main`.

---

## 💾 Database Backup & Disaster Recovery

```bash
# Create automated database snapshot
python scripts/backup_db.py
```
Backups are archived into `/backups` with ISO timestamps.

---

## 📄 License
Official Police Department Enterprise Software — All Rights Reserved.
