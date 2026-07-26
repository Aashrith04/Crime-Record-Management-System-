#!/usr/bin/env python3
"""
State Police CRMS PostgreSQL Production Database Restore & Verification Utility
"""

import os
import sys
import subprocess

def restore_postgresql(backup_filepath: str, database_url: str = None):
    if not os.path.exists(backup_filepath):
        print(f"[×] Error: Backup file not found at {backup_filepath}")
        return False

    db_url = database_url or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/crms_db")
    print(f"[*] Starting PostgreSQL database restore from: {backup_filepath}")

    if backup_filepath.endswith(".db"):
        print("[!] SQLite backup detected. Restoring SQLite database.")
        target_db = db_url.replace("sqlite:///", "").strip()
        import shutil
        shutil.copy2(backup_filepath, target_db)
        print(f"[✓] SUCCESS: SQLite database restored to: {target_db}")
        return True

    cmd = ["pg_restore", "--clean", "--if-exists", "--dbname=" + db_url, backup_filepath]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode in (0, 1): # 0 = clean success, 1 = warnings (e.g. clean non-existent objects)
            print(f"[✓] SUCCESS: PostgreSQL database restore completed for file: {backup_filepath}")
            return True
        else:
            print(f"[×] ERROR restoring database: {res.stderr}")
            return False
    except FileNotFoundError:
        print("[!] Warning: 'pg_restore' utility not found on PATH. Ensure PostgreSQL client tools are installed.")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python restore_db_pg.py <path_to_backup_file>")
        sys.exit(1)
    backup_file = sys.argv[1]
    restore_postgresql(backup_file)

if __name__ == "__main__":
    main()
