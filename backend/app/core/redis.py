import json
import logging
from typing import Any, Optional
from app.core.config import settings

logger = logging.getLogger("crms.redis")

_memory_revocation_store = set()
_memory_cache = {}

try:
    import redis
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.warning(f"Redis initialization warning: {e}. Falling back to memory store.")
    redis_client = None


def is_token_revoked(jti_or_token: str) -> bool:
    """Check if token identifier is in revocation blocklist (Redis or Memory fallback)."""
    if not jti_or_token:
        return False
    key = f"revoked_token:{jti_or_token}"
    if redis_client:
        try:
            return bool(redis_client.exists(key))
        except Exception as e:
            logger.error(f"Redis query error: {e}. Using memory fallback.")
    return jti_or_token in _memory_revocation_store


def revoke_token(jti_or_token: str, expire_seconds: int = 604800) -> bool:
    """Add token identifier to revocation blocklist with expiration time."""
    if not jti_or_token:
        return False
    key = f"revoked_token:{jti_or_token}"
    _memory_revocation_store.add(jti_or_token)
    if redis_client:
        try:
            redis_client.set(key, "revoked", ex=expire_seconds)
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
    return True


def cache_get(key: str) -> Optional[Any]:
    """Retrieve JSON deserialized cached data."""
    if redis_client:
        try:
            data = redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Redis cache_get error: {e}")
    return _memory_cache.get(key)


def cache_set(key: str, value: Any, expire_seconds: int = 300) -> bool:
    """Store serializable value in cache with expiration."""
    try:
        _memory_cache[key] = value
        if redis_client:
            redis_client.setex(key, expire_seconds, json.dumps(value))
        return True
    except Exception as e:
        logger.error(f"Redis cache_set error: {e}")
        return False
