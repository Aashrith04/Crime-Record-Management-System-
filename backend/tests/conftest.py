import os
import sys
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database tables and initial seed data exist for pytest execution."""
    seed_database()
