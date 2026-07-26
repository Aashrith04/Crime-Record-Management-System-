# CRMS Production Backup & Disaster Recovery Guide

## 1. Automated PostgreSQL Database Backups
Production backups are executed via `scripts/backup_db_pg.py`:
```bash
python scripts/backup_db_pg.py
```
- Backups are stored in `backups/` formatted as `crms_pg_backup_YYYYMMDD_HHMMSS.sql`.
- Automated retention enforcement deletes backups older than 30 days.

## 2. Database Restoration Utility
To restore a database backup:
```bash
python scripts/restore_db_pg.py backups/crms_pg_backup_20260726_233000.sql
```
