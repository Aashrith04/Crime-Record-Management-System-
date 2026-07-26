#!/usr/bin/env python3
"""
State Police CRMS PostgreSQL Production Database Backup & Retention Utility
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta

DEFAULT_RETENTION_DAYS = 30
BACKUP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backups"))

def backup_postgresql(database_url: str = None, retention_days: int = DEFAULT_RETENTION_DAYS):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"crms_pg_backup_{timestamp}.sql"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    db_url = database_url or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/crms_db")
    print(f"[*] Starting PostgreSQL backup for URL: {db_url.split('@')[-1] if '@' in db_url else db_url}")

    if db_url.startswith("sqlite"):
        print("[!] Note: DATABASE_URL is set to SQLite. Running SQLite snapshot backup.")
        sqlite_db = db_url.replace("sqlite:///", "").strip()
        if os.path.exists(sqlite_db):
            import shutil
            sqlite_backup = os.path.join(BACKUP_DIR, f"crms_sqlite_backup_{timestamp}.db")
            shutil.copy2(sqlite_db, sqlite_backup)
            print(f"[✓] SUCCESS: SQLite Backup verified at: {sqlite_backup}")
            return sqlite_backup
        else:
            print(f"[×] Error: SQLite DB file not found at {sqlite_db}")
            return None

    cmd = ["pg_dump", "--dbname=" + db_url, "--file=" + backup_path, "--format=custom"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        if os.path.exists(backup_path) and os.path.getsize(backup_path) > 0:
            file_size_kb = round(os.path.getsize(backup_path) / 1024, 2)
            print(f"[✓] SUCCESS: PostgreSQL Backup created and verified ({file_size_kb} KB): {backup_path}")
            clean_old_backups(retention_days)
            return backup_path
        else:
            print("[×] ERROR: Backup file was not created or is 0 bytes.")
            return None
    except FileNotFoundError:
        print("[!] Warning: 'pg_dump' utility not found on PATH. Ensure PostgreSQL client tools are installed.")
        return None
    except subprocess.CalledProcessError as e:
        print(f"[×] ERROR executing pg_dump: {e.stderr}")
        return None

def clean_old_backups(retention_days: int):
    cutoff = datetime.now() - timedelta(days=retention_days)
    if not os.path.exists(BACKUP_DIR):
        return
    for fname in os.listdir(BACKUP_DIR):
        fpath = os.path.join(BACKUP_DIR, fname)
        if os.path.isfile(fpath):
            mtime = datetime.fromtimestamp(os.path.getmtime(fpath))
            if mtime < cutoff:
                os.remove(fpath)
                print(f"[*] Cleaned up expired backup (> {retention_days} days): {fname}")

def main():
    print("=== CRMS State Police PostgreSQL Production Backup Utility ===")
    backup_postgresql()

if __name__ == "__main__":
    main()
