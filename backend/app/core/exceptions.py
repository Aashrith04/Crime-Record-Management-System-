from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.requests import Request

class CustomAPIException(HTTPException):
    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: str = "GENERIC_ERROR",
        errors: Optional[List[Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=message)
        self.message = message
        self.error_code = error_code
        self.errors = errors or []

class NotFoundException(CustomAPIException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, message=message, error_code="RESOURCE_NOT_FOUND")

class UnauthorizedException(CustomAPIException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, message=message, error_code="UNAUTHORIZED")

class ForbiddenException(CustomAPIException):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, message=message, error_code="FORBIDDEN")

class BadRequestException(CustomAPIException):
    def __init__(self, message: str = "Invalid request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, message=message, error_code="BAD_REQUEST")

async def custom_exception_handler(request: Request, exc: CustomAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "errors": exc.errors,
        },
    )

async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected internal server error occurred.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "errors": [str(exc)] if settings_is_debug() else [],
        },
    )

def settings_is_debug():
    from app.core.config import settings
    return settings.DEBUG
