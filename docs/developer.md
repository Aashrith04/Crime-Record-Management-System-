# CRMS Developer & Architecture Guide

## 1. System Architecture Pattern
CRMS follows a strict **Layered Architecture**:
- `app/api/`: FastAPI APIRouter endpoint definitions.
- `app/services/`: Business logic, workflows, and service orchestration.
- `app/repositories/`: Data access layer isolating SQLAlchemy ORM calls.
- `app/models/`: SQLAlchemy 2.0 database entities.
- `app/schemas/`: Pydantic V2 data validation and serialization models.

## 2. Local Environment Setup
```bash
# Backend Setup
cd backend
python -m venv venv
# Activate virtual environment
pip install -r requirements.txt
python -m app.seed
python -m app.main

# Frontend Setup
cd frontend
npm install
npm run dev
```
