import pytest
from app.core.database import SessionLocal
from app.intelligence.repository import DuplicateRepository, EntityRepository

def test_intelligence_repository_methods():
    db = SessionLocal()
    try:
        entity_repo = EntityRepository(db)
        entities = entity_repo.get_all_resolved_entities(limit=10)
        assert isinstance(entities, list)

        dup_repo = DuplicateRepository(db)
        dups = dup_repo.find_potential_criminal_duplicates()
        assert isinstance(dups, list)
    finally:
        db.close()
