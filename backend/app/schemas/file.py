from pydantic import BaseModel
from datetime import datetime
from app.models.file import ReviewStatus

class FileBase(BaseModel):
    filename: str
    description: str | None = None
    property_id: int | None = None
    document_type: str  # required document type
    # document_type: str  # removed

class FileCreate(FileBase):
    pass

class FileReviewUpdate(BaseModel):
    review_status: ReviewStatus

class FileNotesUpdate(BaseModel):
    notes: str | None = None

class FileExpiryUpdate(BaseModel):
    expires_at: datetime

class FileResponse(FileBase):
    id: int
    file_path: str
    file_type: str | None = None
    file_size: int | None = None
    uploaded_by: int
    uploaded_at: datetime
    notes: str | None = None
    review_status: ReviewStatus | None = None

    class Config:
        from_attributes = True 