import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.ai.embeddings import EmbeddingFactory
from app.ai.models import SemanticVectorIndex
from app.ai.utils import dot_product_vectors

class VectorStoreRepository:
    def __init__(self, db: Session):
        self.db = db
        self.embedder = EmbeddingFactory.get_provider()

    def upsert_index(
        self,
        entity_type: str,
        entity_public_id: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SemanticVectorIndex:
        vector = self.embedder.embed_text(content)
        vector_str = json.dumps(vector)
        meta_str = json.dumps(metadata) if metadata else None

        existing = self.db.query(SemanticVectorIndex).filter(
            SemanticVectorIndex.entity_type == entity_type,
            SemanticVectorIndex.entity_public_id == entity_public_id
        ).first()

        if existing:
            existing.content = content
            existing.vector_json = vector_str
            existing.metadata_json = meta_str
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            record = SemanticVectorIndex(
                entity_type=entity_type,
                entity_public_id=entity_public_id,
                content=content,
                vector_json=vector_str,
                metadata_json=meta_str
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            return record

    def similarity_search(
        self,
        query: str,
        entity_type: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        query_vec = self.embedder.embed_text(query)
        q = self.db.query(SemanticVectorIndex)
        if entity_type and entity_type.lower() != "all":
            q = q.filter(SemanticVectorIndex.entity_type.ilike(entity_type))

        all_indices = q.all()
        scored = []
        for idx in all_indices:
            try:
                vec = json.loads(idx.vector_json)
                score = dot_product_vectors(query_vec, vec)
                scored.append({
                    "score": round(score, 4),
                    "entity_type": idx.entity_type,
                    "entity_public_id": idx.entity_public_id,
                    "content": idx.content,
                    "metadata": json.loads(idx.metadata_json) if idx.metadata_json else {}
                })
            except Exception:
                continue

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]
