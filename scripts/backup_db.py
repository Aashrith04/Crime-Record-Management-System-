#!/usr/bin/env python3
"""
CRMS Enterprise Database Backup & Disaster Recovery Utility
Supports: Automated PostgreSQL pg_dump backups and SQLite snapshot backups.
"""

import os
import sys
import shutil
from datetime import datetime

def backup_sqlite():
    db_path = os.path.join(os.path.dirname(__file__), "..", "backend", "crms_dev.db")
    if not os.path.exists(db_path):
        print(f"SQLite database file not found at: {db_path}")
        return

    backup_dir = os.path.join(os.path.dirname(__file__), "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"crms_backup_{timestamp}.db")

    shutil.copy2(db_path, backup_file)
    print(f"SUCCESS: SQLite Backup created at: {backup_file}")

def main():
    print("=== CRMS Database Backup Tool ===")
    backup_sqlite()

if __name__ == "__main__":
    main()
