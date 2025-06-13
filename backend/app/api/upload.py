from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Form, status, Body
from fastapi.responses import FileResponse, StreamingResponse
import shutil
import os
from typing import Optional
from app.core.security import get_current_user
from app.models.file import File as FileModel, ReviewStatus, DocumentType
from app.schemas.file import FileResponse, FileNotesUpdate, FileReviewUpdate, FileExpiryUpdate
from sqlalchemy.orm import Session
from app.core.database import get_db
import mimetypes
from app.models.user import User
from app.models.property import Property

router = APIRouter()

UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    property_id: Optional[int] = Form(None),
    document_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_location = None  # Initialize file_location at the start
    try:
        # Convert document_type to enum
        try:
            doc_type = DocumentType[document_type.upper()]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid document type. Must be one of: {', '.join([dt.name for dt in DocumentType])}"
            )

        # Check property access if property_id is provided
        if property_id is not None:
            prop = db.query(Property).filter(Property.id == property_id).first()
            if not prop:
                raise HTTPException(
                    status_code=404,
                    detail="Property not found"
                )
            # Compare user IDs instead of User objects
            if (prop.buyer_id != current_user.id and 
                prop.buyer_solicitor_id != current_user.id and 
                prop.seller_solicitor_id != current_user.id and 
                prop.estate_agent_id != current_user.id and
                prop.seller_id != current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized for this property"
                )

        # Create a safe filename
        safe_filename = file.filename.replace(" ", "_")
        file_location = os.path.join(UPLOAD_DIR, safe_filename)
        print(f"Saving file to: {file_location}")  # Debug print

        # Save the file
        try:
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            if file_location and os.path.exists(file_location):
                os.remove(file_location)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )

        # Get file metadata
        try:
            file_size = os.path.getsize(file_location)
            file_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        except Exception as e:
            if file_location and os.path.exists(file_location):
                os.remove(file_location)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get file metadata: {str(e)}"
            )

        # Create file record in database
        try:
            db_file = FileModel(
                filename=safe_filename,
                file_path=file_location,
                file_type=file_type,
                file_size=file_size,
                uploaded_by=current_user.id,
                property_id=property_id,
                description=description,
                document_type=doc_type,
                review_status=ReviewStatus.PENDING
            )
            db.add(db_file)
            db.commit()
            db.refresh(db_file)
            return db_file
        except Exception as e:
            if file_location and os.path.exists(file_location):
                os.remove(file_location)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create file record: {str(e)}"
            )

    except HTTPException:
        if file_location and os.path.exists(file_location):
            os.remove(file_location)
        raise
    except Exception as e:
        if file_location and os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/files", response_model=list[FileResponse])
async def get_files(
    property_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] user.id={current_user.id}, property_id={property_id}")
    query = db.query(FileModel)
    
    if property_id is not None:
        prop = db.query(Property).filter(Property.id == property_id).first()
        print(f"[DEBUG] property found: {prop is not None}, buyer_id={getattr(prop, 'buyer_id', None)}, buyer_solicitor_id={getattr(prop, 'buyer_solicitor_id', None)}, seller_solicitor_id={getattr(prop, 'seller_solicitor_id', None)}, estate_agent_id={getattr(prop, 'estate_agent_id', None)}")
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        if (prop.buyer_id != current_user.id and 
            prop.buyer_solicitor_id != current_user.id and 
            prop.seller_solicitor_id != current_user.id and 
            prop.estate_agent_id != current_user.id and
            prop.seller_id != current_user.id):
            print("[DEBUG] Not authorized for this property")
            raise HTTPException(status_code=403, detail="Not authorized for this property")
        query = query.filter(FileModel.property_id == property_id)
    
    files = query.all()
    print(f"[DEBUG] Returning {len(files)} files")
    response = files
    return response

@router.get("/files/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file.property_id:
        prop = db.query(Property).filter(Property.id == file.property_id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        if (prop.buyer_id != current_user.id and 
            prop.buyer_solicitor_id != current_user.id and 
            prop.seller_solicitor_id != current_user.id and 
            prop.estate_agent_id != current_user.id and
            prop.seller_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized for this property")
    
    return file

@router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file or not os.path.exists(file.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    if file.property_id:
        prop = db.query(Property).filter(Property.id == file.property_id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        if (prop.buyer_id != current_user.id and 
            prop.buyer_solicitor_id != current_user.id and 
            prop.seller_solicitor_id != current_user.id and 
            prop.estate_agent_id != current_user.id and
            prop.seller_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized for this property")
    
    def iterfile():
        with open(file.file_path, mode="rb") as f:
            yield from f
    
    media_type = file.file_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    response = StreamingResponse(iterfile(), media_type=media_type)
    response.headers["Content-Disposition"] = f'attachment; filename="{file.filename}"'
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user  # current_user is already a User object
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    prop = db.query(Property).filter(Property.id == file.property_id).first()
    if not prop or (prop.buyer_id != user.id and 
                   prop.buyer_solicitor_id != user.id and 
                   prop.seller_solicitor_id != user.id and 
                   prop.estate_agent_id != user.id and
                   prop.seller_id != user.id):
        raise HTTPException(status_code=403, detail="Not authorized for this property")
    if os.path.exists(file.file_path):
        os.remove(file.file_path)
    db.delete(file)
    db.commit()
    return

@router.patch("/files/{file_id}/notes", response_model=FileResponse)
async def update_file_notes(
    file_id: int,
    notes_update: FileNotesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user  # current_user is already a User object
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    prop = db.query(Property).filter(Property.id == file.property_id).first()
    if not prop or (prop.buyer_id != user.id and 
                   prop.buyer_solicitor_id != user.id and 
                   prop.seller_solicitor_id != user.id and 
                   prop.estate_agent_id != user.id and
                   prop.seller_id != user.id):
        raise HTTPException(status_code=403, detail="Not authorized for this property")
    file.notes = notes_update.notes
    db.commit()
    db.refresh(file)
    return file

@router.patch("/files/{file_id}/review", response_model=FileResponse)
async def update_file_review(
    file_id: int,
    review_update: FileReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get the file
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user is a solicitor for this property
    if file.property_id:
        prop = db.query(Property).filter(Property.id == file.property_id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        if prop.buyer_solicitor_id != current_user.id and prop.seller_solicitor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the property's solicitor can review documents")
    
    # Update review status
    file.review_status = review_update.review_status
    db.commit()
    db.refresh(file)
    
    # If denied, delete the file
    if review_update.review_status == ReviewStatus.DENIED:
        try:
            if os.path.exists(file.file_path):
                os.remove(file.file_path)
            db.delete(file)
            db.commit()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete file: {str(e)}"
            )
    
    return file

@router.patch("/files/{file_id}/expiry", response_model=FileResponse)
async def update_file_expiry(
    file_id: int,
    expiry_update: FileExpiryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] Received expires_at: {expiry_update.expires_at}")
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    if file.property_id:
        prop = db.query(Property).filter(Property.id == file.property_id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        if (prop.buyer_id != current_user.id and \
            prop.buyer_solicitor_id != current_user.id and \
            prop.seller_solicitor_id != current_user.id and \
            prop.estate_agent_id != current_user.id and \
            prop.seller_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized for this property")
    file.expires_at = expiry_update.expires_at
    db.commit()
    db.refresh(file)
    print(f"[DEBUG] Saved expires_at in DB: {file.expires_at}")
    return file 