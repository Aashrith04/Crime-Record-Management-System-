import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import CustomAPIException, custom_exception_handler, generic_exception_handler
from app.core.logging import setup_logging
from app.seed import seed_database

setup_logging()

limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Police Crime Record Management System (CRMS) REST API with RBAC, AI Copilot, GIS Mapping & Automated FIR Generation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Prometheus Metrics Instrumentator
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app, endpoint="/metrics", tags=["Observability"])
except Exception as e:
    print(f"Prometheus instrumentation warning: {e}")

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files for Uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register Exception Handlers
app.add_exception_handler(CustomAPIException, custom_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup DB seed exception: {e}")

@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
