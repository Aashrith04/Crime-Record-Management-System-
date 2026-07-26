import os
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import BadRequestException
from app.dependencies.auth_deps import get_current_user
from app.models.user import User
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/uploads", tags=["File Uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4", "avi", "mov", "mp3", "wav", "doc", "docx"
}

@router.post("", response_model=StandardResponse[dict])
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise BadRequestException("No file uploaded.")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestException(f"File type '.{ext}' is not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    unique_filename = f"{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    base_url = str(request.base_url).rstrip("/")
    file_url = f"{base_url}/static/uploads/{unique_filename}"

    return StandardResponse(
        success=True,
        message="File uploaded successfully to server storage.",
        data={
            "file_name": file.filename,
            "saved_filename": unique_filename,
            "file_url": file_url,
            "file_size": len(content),
            "content_type": file.content_type
        }
    )
