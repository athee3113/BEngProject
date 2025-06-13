from fastapi import APIRouter, Depends, HTTPException, UploadFile, Body
from sqlalchemy.orm import Session
from app.models.property import Property, PropertyStage, PropertyStatus
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.models.file import File
from app.models.message import Message
from app.core.database import get_db
from app.core.security import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
from app.schemas.property import PropertyResponse
import openai
import re
from app.models.stage_info import StageInfo

router = APIRouter()

# Preset stages for property conveyancing
PRESET_STAGES = [
    {"stage": "Offer Accepted", "responsible_role": "estate_agent", "description": "Initial acceptance of offer by the estate agent"},
    {"stage": "Buyer ID Verification", "responsible_role": "buyer", "description": "Buyer provides proof of ID and address"},
    {"stage": "Seller ID Verification", "responsible_role": "seller", "description": "Seller provides proof of ID and address"},
    {"stage": "Draft Contract Issued", "responsible_role": "seller_solicitor", "description": "Seller's solicitor prepares and issues draft contract"},
    {"stage": "Searches Ordered", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor orders property searches"},
    {"stage": "Searches Received & Reviewed", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor reviews search results"},
    {"stage": "Survey Booked", "responsible_role": "buyer", "description": "Buyer arranges property survey"},
    {"stage": "Survey Completed", "responsible_role": "surveyor", "description": "Surveyor completes property survey"},
    {"stage": "Mortgage Offer Received", "responsible_role": "buyer", "description": "Buyer receives mortgage offer from lender"},
    {"stage": "Proof of Funds Verified", "responsible_role": "buyer", "description": "Buyer provides proof of funds"},
    {"stage": "Enquiries Raised by Buyer's Solicitor", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor raises enquiries"},
    {"stage": "Enquiries Answered by Seller's Solicitor", "responsible_role": "seller_solicitor", "description": "Seller's solicitor answers enquiries"},
    {"stage": "Final Contract Approved", "responsible_role": "both_solicitors", "description": "Both solicitors approve final contract"},
    {"stage": "Contracts Signed by Buyer & Seller", "responsible_role": "both_parties", "description": "Buyer and seller sign contracts"},
    {"stage": "Completion Date Agreed", "responsible_role": "both_solicitors", "description": "Both solicitors agree on completion date"},
    {"stage": "Deposit Paid by Buyer", "responsible_role": "buyer", "description": "Buyer pays deposit to solicitor"},
    {"stage": "Contracts Exchanged", "responsible_role": "both_solicitors", "description": "Solicitors exchange contracts"},
    {"stage": "Final Checks & Funds Requested", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor requests final funds"},
    {"stage": "Completion Day", "responsible_role": "buyer_solicitor", "description": "Property ownership transfers to buyer"},
    {"stage": "Keys Released & Registration", "responsible_role": "estate_agent", "description": "Keys released and property registered"}
]

# Schemas (simple inline for now)
class PropertyBase(BaseModel):
    address: str
    postcode: str
    status: Optional[str] = "available"
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    price: Optional[float] = None
    tenure: Optional[str] = None
    buyer_solicitor_id: Optional[int] = None
    seller_solicitor_id: Optional[int] = None
    estate_agent_id: Optional[int] = None
    seller_id: Optional[int] = None

class PropertyCreate(PropertyBase):
    buyer_id: int

class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    status: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    price: Optional[float] = None
    tenure: Optional[str] = None
    buyer_solicitor_id: Optional[int] = None
    seller_solicitor_id: Optional[int] = None

class PropertyStageBase(BaseModel):
    stage: str
    status: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    responsible: Optional[str] = None
    order: Optional[int] = None
    responsible_role: Optional[str] = None

class PropertyStageCreate(PropertyStageBase):
    pass

class PropertyStageUpdate(PropertyStageBase):
    pass

class PropertyStageResponse(PropertyStageBase):
    id: int
    property_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    responsible_role: Optional[str] = None

    class Config:
        orm_mode = True

class TimelineApprovalRequest(BaseModel):
    """Request model for timeline approval."""
    approved: bool = True
    comment: Optional[str] = None

class ReorderStagesRequest(BaseModel):
    stage_ids: List[int]

@router.get("/properties", response_model=List[PropertyResponse])
def get_user_properties(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Property).filter(
        (Property.buyer_id == current_user.id) |
        (Property.buyer_solicitor_id == current_user.id) |
        (Property.seller_solicitor_id == current_user.id) |
        (Property.estate_agent_id == current_user.id)
    ).all()

@router.get("/properties/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (
        prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    return prop

@router.post("/properties", response_model=PropertyResponse)
def create_property(data: PropertyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user is an estate agent or admin
    if not (current_user.role.value == "estate_agent" or current_user.role.value == "admin"):
        raise HTTPException(status_code=403, detail="Only estate agents or admin can create a property")

    # Validate assigned users
    def validate_user(user_id, expected_roles):
        if user_id is None:
            return
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=400, detail=f"User with id {user_id} does not exist")
        if user.role.value not in expected_roles:
            raise HTTPException(status_code=400, detail=f"User {user.email} does not have a valid role for this assignment (expected: {expected_roles}, got: {user.role.value})")

    validate_user(data.buyer_id, ["buyer"])
    validate_user(data.seller_id, ["seller"])
    validate_user(data.buyer_solicitor_id, ["solicitor"])
    validate_user(data.seller_solicitor_id, ["solicitor"])
    validate_user(data.estate_agent_id, ["estate_agent"])

    # Convert status string to enum value if provided
    status = PropertyStatus.AVAILABLE.name
    if data.status:
        try:
            status = PropertyStatus(data.status.lower()).name
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {[s.value for s in PropertyStatus]}")

    prop = Property(
        address=data.address,
        postcode=data.postcode,
        status=status,
        property_type=data.property_type,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        price=data.price,
        tenure=data.tenure,
        buyer_id=data.buyer_id,
        seller_id=data.seller_id,
        buyer_solicitor_id=data.buyer_solicitor_id,
        seller_solicitor_id=data.seller_solicitor_id,
        estate_agent_id=data.estate_agent_id
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)

    # Add preset stages
    for i, stage_data in enumerate(PRESET_STAGES):
        stage = PropertyStage(
            property_id=prop.id,
            stage=stage_data["stage"],
            status="pending",
            description=stage_data["description"],
            responsible_role=stage_data["responsible_role"],
            order=i,
            is_draft=False
        )
        db.add(stage)
        # Add stage_info for all roles if not exists
        for role in UserRole:
            exists = db.query(StageInfo).filter_by(stage=stage_data["stage"], role=role.value).first()
            if not exists:
                db.add(StageInfo(stage=stage_data["stage"], role=role.value, explanation=f"Explain the {stage_data['stage']}"))
    db.commit()

    return prop

@router.patch("/properties/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, data: PropertyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (
        prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(prop, field, value)
    db.commit()
    db.refresh(prop)
    return prop

@router.get("/properties/{property_id}/stages", response_model=List[PropertyStageResponse])
def get_property_stages(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if (prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    stages = db.query(PropertyStage).filter(PropertyStage.property_id == property_id).order_by(PropertyStage.order).all()
    result = []
    for s in stages:
        d = s.__dict__.copy()
        d['responsible_role'] = getattr(s, 'responsible_role', None) or getattr(s, 'responsible', None)
        d.pop('_sa_instance_state', None)
        result.append(PropertyStageResponse(**d))
    return result

@router.post("/properties/{property_id}/stages", response_model=PropertyStageResponse)
def create_property_stage(property_id: int, stage: PropertyStageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (prop.buyer_id != current_user.id and prop.buyer_solicitor_id != current_user.id and prop.seller_solicitor_id != current_user.id and prop.estate_agent_id != current_user.id):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    order = getattr(stage, 'order', None)
    if order is not None:
        db.query(PropertyStage).filter(
            PropertyStage.property_id == property_id,
            PropertyStage.order >= order
        ).update({PropertyStage.order: PropertyStage.order + 1}, synchronize_session=False)
        db.commit()
    else:
        max_order = db.query(PropertyStage).filter(PropertyStage.property_id == property_id).count()
        order = max_order
    db_stage = PropertyStage(
        property_id=property_id,
        order=order,
        **stage.dict(exclude_unset=True, exclude={'order'})
    )
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)

    # Ensure stage_info exists for all roles
    for role in UserRole:
        exists = db.query(StageInfo).filter_by(stage=db_stage.stage, role=role.value).first()
        if not exists:
            db.add(StageInfo(stage=db_stage.stage, role=role.value, explanation=f"Explain the {db_stage.stage}"))
    db.commit()

    return db_stage

@router.patch("/properties/{property_id}/stages/{stage_id}", response_model=PropertyStageResponse)
def update_property_stage(property_id: int, stage_id: int, stage: PropertyStageUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (prop.buyer_id != current_user.id and prop.buyer_solicitor_id != current_user.id and prop.seller_solicitor_id != current_user.id and prop.estate_agent_id != current_user.id):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    db_stage = db.query(PropertyStage).filter(PropertyStage.id == stage_id, PropertyStage.property_id == property_id).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    is_completing = stage.status == 'completed' and db_stage.status != 'completed'
    
    for field, value in stage.dict(exclude_unset=True).items():
        setattr(db_stage, field, value)
    
    if is_completing:
        next_stage = db.query(PropertyStage).filter(
            PropertyStage.property_id == property_id,
            PropertyStage.id > db_stage.id,
            PropertyStage.status == 'pending'
        ).order_by(PropertyStage.id).first()
        if next_stage:
            next_stage.status = 'in-progress'
        
        users_to_notify = [
            prop.buyer_id,
            prop.buyer_solicitor_id,
            prop.seller_solicitor_id,
            prop.estate_agent_id,
            prop.seller_id
        ]
        
        for user_id in users_to_notify:
            if user_id and user_id != current_user.id:
                notif = Notification(
                    user_id=user_id,
                    property_id=property_id,
                    message=f"Stage '{db_stage.stage}' has been completed by {current_user.first_name} {current_user.last_name}.",
                    type="stage_completed"
                )
                db.add(notif)
    
    db.commit()
    db.refresh(db_stage)
    return db_stage

@router.get("/properties/{property_id}/notifications")
def get_property_notifications(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (
        prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    
    notifications = db.query(Notification).filter(
        Notification.property_id == property_id,
        Notification.user_id == current_user.id,
        Notification.read == False
    ).order_by(Notification.created_at.desc()).all()
    
    return notifications

@router.post("/notifications/{notification_id}/read")
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    db.commit()
    print(f"Notification {notification_id} marked as read for user {current_user.id}")
    return {"success": True}

@router.get("/properties/{property_id}/notifications/all")
def get_all_property_notifications(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (
        prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    
    notifications = db.query(Notification).filter(
        Notification.property_id == property_id,
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()
    
    return notifications

@router.post("/properties/{property_id}/stages/{stage_id}/complete")
def complete_stage(
    property_id: int,
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (
        prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    
    stage = db.query(PropertyStage).filter(PropertyStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    stage.status = "completed"
    stage.completed_at = datetime.utcnow()
    db.commit()
    
    users_to_notify = [
        prop.buyer_id,
        prop.buyer_solicitor_id,
        prop.seller_solicitor_id,
        prop.estate_agent_id,
        prop.seller_id
    ]
    
    for user_id in users_to_notify:
        if user_id and user_id != current_user.id:
            notif = Notification(
                user_id=user_id,
                property_id=property_id,
                message=f"Stage '{stage.stage}' has been completed by {current_user.first_name} {current_user.last_name}.",
                type="stage_completed"
            )
            db.add(notif)
    
    db.commit()
    return {"message": "Stage completed successfully"}

@router.post("/properties/{property_id}/documents")
async def upload_document(
    property_id: int,
    file: UploadFile,
    document_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (
        prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Property not found or access denied")
    
    try:
        upload_dir = f"uploads/{property_id}"
        os.makedirs(upload_dir, exist_ok=True)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = f"{upload_dir}/{filename}"
        
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        document = File(
            property_id=property_id,
            filename=filename,
            original_filename=file.filename,
            document_type=document_type,
            uploaded_by=current_user.id,
            file_path=file_path
        )
        db.add(document)
        db.commit()
        
        document_labels = {
            'proof_of_id': 'Proof of ID',
            'proof_of_address': 'Proof of Address',
            'survey_report': 'Survey Report',
            'local_authority_search': 'Local Authority Search',
            'draft_contract': 'Draft Contract'
        }
        document_label = document_labels.get(document_type, document_type)
        
        users_to_notify = [
            prop.buyer_id,
            prop.buyer_solicitor_id,
            prop.seller_solicitor_id,
            prop.estate_agent_id,
            prop.seller_id
        ]
        
        for user_id in users_to_notify:
            if user_id and user_id != current_user.id:
                notif = Notification(
                    user_id=user_id,
                    property_id=property_id,
                    message=f"{document_label} has been uploaded by {current_user.first_name} {current_user.last_name}.",
                    type="document_uploaded"
                )
                db.add(notif)
        
        db.commit()
        return {"message": "Document uploaded successfully", "document_id": document.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.delete("/properties/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    # Only estate agent assigned to property can delete
    if not (current_user.role.value == "estate_agent" and prop.estate_agent_id == current_user.id):
        raise HTTPException(status_code=403, detail="Only the assigned estate agent can delete this property")
    db.query(PropertyStage).filter(PropertyStage.property_id == property_id).delete()
    db.query(Notification).filter(Notification.property_id == property_id).delete()
    db.query(File).filter(File.property_id == property_id).delete()
    db.delete(prop)
    db.commit()
    return {"message": "Property and all associated data deleted successfully"}

@router.delete("/properties/{property_id}/stages/{stage_id}", response_model=PropertyStageResponse)
def delete_property_stage(
    property_id: int,
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a property stage and reorder remaining stages."""
    # Check if user has access to the property
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    # Check if user is a solicitor for this property
    if not (current_user.id == property.buyer_solicitor_id or current_user.id == property.seller_solicitor_id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this property's stages")
    # Check if timeline is locked
    if property.timeline_locked:
        raise HTTPException(status_code=400, detail="Cannot modify stages when timeline is locked")
    # Get the stage
    stage = db.query(PropertyStage).filter(
        PropertyStage.id == stage_id,
        PropertyStage.property_id == property_id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    deleted_order = stage.order
    # Delete the stage
    db.delete(stage)
    db.commit()
    # Decrement order of all subsequent stages
    db.query(PropertyStage).filter(PropertyStage.property_id == property_id, PropertyStage.order > deleted_order).update({PropertyStage.order: PropertyStage.order - 1})
    db.commit()
    return stage

@router.post("/properties/{property_id}/timeline-approval", response_model=PropertyResponse)
async def approve_timeline(
    property_id: int,
    approval: TimelineApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve the timeline for a property.
    Requires both buyer and seller solicitors to approve before locking.
    """
    # Get the property
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check if user is authorized to approve
    is_buyer_solicitor = current_user.id == property.buyer_solicitor_id
    is_seller_solicitor = current_user.id == property.seller_solicitor_id
    
    if not (is_buyer_solicitor or is_seller_solicitor):
        raise HTTPException(
            status_code=403, 
            detail="Only solicitors assigned to this property can approve the timeline"
        )

    # Check if timeline is already locked
    if property.timeline_locked:
        raise HTTPException(
            status_code=400, 
            detail="Timeline is already locked and cannot be modified"
        )

    # Check if this solicitor has already approved
    if is_buyer_solicitor and property.timeline_approved_by_buyer_solicitor:
        raise HTTPException(
            status_code=400, 
            detail="Buyer solicitor has already approved the timeline"
        )
    if is_seller_solicitor and property.timeline_approved_by_seller_solicitor:
        raise HTTPException(
            status_code=400, 
            detail="Seller solicitor has already approved the timeline"
        )

    try:
        # Update approval status
        if is_buyer_solicitor:
            property.timeline_approved_by_buyer_solicitor = True
        else:
            property.timeline_approved_by_seller_solicitor = True

        # Check if both solicitors have approved
        if property.timeline_approved_by_buyer_solicitor and property.timeline_approved_by_seller_solicitor:
            property.timeline_locked = True

        # Add approval comment if provided
        if approval.comment:
            # Create a notification for the other solicitor
            other_solicitor_id = property.seller_solicitor_id if is_buyer_solicitor else property.buyer_solicitor_id
            notification = Notification(
                user_id=other_solicitor_id,
                property_id=property.id,
                message=f"Timeline approved with comment: {approval.comment}",
                type="timeline_approval"
            )
            db.add(notification)

        db.commit()
        db.refresh(property)

        return property

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/properties/{property_id}/reset-stages")
def reset_property_stages(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    # Only allow users associated with the property
    if (prop.buyer_id != current_user.id and 
        prop.buyer_solicitor_id != current_user.id and 
        prop.seller_solicitor_id != current_user.id and 
        prop.estate_agent_id != current_user.id and
        prop.seller_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    # Reset all stages
    stages = db.query(PropertyStage).filter(PropertyStage.property_id == property_id).all()
    for stage in stages:
        stage.status = 'pending'
        stage.start_date = None
        stage.completion_date = None
    # Unlock timeline
    prop.timeline_locked = False
    prop.timeline_approved_by_buyer_solicitor = False
    prop.timeline_approved_by_seller_solicitor = False
    db.commit()
    return {"message": "Stages reset and timeline unlocked"}

@router.post("/properties/{property_id}/unlock-timeline", response_model=PropertyResponse)
def unlock_timeline(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlock the timeline for a property. Only the assigned buyer or seller solicitor can perform this action.
    Resets timeline_locked and both approvals to False.
    """
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    is_buyer_solicitor = current_user.id == property.buyer_solicitor_id
    is_seller_solicitor = current_user.id == property.seller_solicitor_id
    if not (is_buyer_solicitor or is_seller_solicitor):
        raise HTTPException(status_code=403, detail="Only assigned solicitors can unlock the timeline")

    property.timeline_locked = False
    property.timeline_approved_by_buyer_solicitor = False
    property.timeline_approved_by_seller_solicitor = False
    db.commit()
    db.refresh(property)
    return property

# --- AI Filter Placeholder ---
def ai_filter_message(text: str) -> str:
    openai.api_key = os.getenv('OPENAI_API_KEY')
    try:
        # Always rephrase the message
        rephrase_prompt = f"""Please rephrase the following message to be more professional and appropriate for a property transaction context. \
        Keep the main points but make it more formal and business-like:\n\n        Original message: {text}\n\n        Rephrased message:"""
        rephrase_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional real estate communication assistant. Your task is to rephrase messages to be more professional and appropriate for property transactions."},
                {"role": "user", "content": rephrase_prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        rephrased_text = rephrase_response.choices[0].message.content.strip()

        # Extract only the actual rephrased message (after the last colon)
        if ":" in rephrased_text:
            rephrased_text = rephrased_text.split(":")[-1].strip()

        # Optionally, check moderation on the rephrased text
        try:
            rephrased_check = openai.moderations.create(input=rephrased_text)
            if not rephrased_check.results[0].flagged:
                return rephrased_text
            else:
                return '[Flagged by AI] ' + rephrased_text
        except Exception as e:
            print(f"OpenAI moderation error: {e}")
            return rephrased_text

    except Exception as e:
        print(f"OpenAI rephrasing error: {e}")
        return '[AI moderation unavailable] ' + text

# --- Messaging Endpoints ---
from fastapi import status as http_status

@router.post("/properties/{property_id}/stages/{stage_id}/messages")
def send_message(property_id: int, stage_id: int, body: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Buyer or seller sends a message to the other party. Message is AI-filtered and sent for estate agent approval.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    # Only buyer or seller can send
    if current_user.id not in [prop.buyer_id, prop.seller_id]:
        raise HTTPException(status_code=403, detail="Only buyer or seller can send messages")
    recipient_id = prop.seller_id if current_user.id == prop.buyer_id else prop.buyer_id
    original_content = body.get('content', '')
    print(f"[DEBUG] Received message content: '{original_content}' from user {current_user.id}")
    filtered_content = ai_filter_message(original_content)
    msg = Message(
        sender_id=current_user.id,
        recipient_id=recipient_id,
        property_id=property_id,
        stage_id=stage_id,
        content=filtered_content,
        original_content=original_content,
        filtered_content=filtered_content,
        approval_status='pending',
        status='pending'
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"message": "Message sent for agent approval", "id": msg.id}

@router.get("/properties/{property_id}/pending-messages")
def get_pending_messages(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Estate agent fetches all pending messages for this property.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or current_user.id != prop.estate_agent_id:
        raise HTTPException(status_code=403, detail="Only the estate agent can view pending messages")
    messages = db.query(Message).filter(Message.property_id == property_id, Message.approval_status == 'pending').all()
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "stage_id": m.stage_id,
            "original_content": m.original_content,
            "filtered_content": m.filtered_content,
            "timestamp": m.timestamp
        } for m in messages
    ]

@router.post("/properties/{property_id}/messages/{message_id}/approve")
def approve_message(property_id: int, message_id: int, body: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Estate agent approves either the original or filtered message version.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or current_user.id != prop.estate_agent_id:
        raise HTTPException(status_code=403, detail="Only the estate agent can approve messages")
    msg = db.query(Message).filter(Message.id == message_id, Message.property_id == property_id).first()
    if not msg or msg.approval_status != 'pending':
        raise HTTPException(status_code=404, detail="Message not found or already approved")
    version = body.get('version', 'filtered')  # 'original' or 'filtered'
    if version == 'original':
        approved_content = msg.original_content
    else:
        approved_content = msg.filtered_content
    msg.approved_content = approved_content
    msg.approval_status = 'approved'
    msg.approved_by = current_user.id
    msg.status = 'approved'
    db.commit()
    return {"message": "Message approved and delivered", "approved_content": approved_content}

@router.post("/properties/{property_id}/messages/{message_id}/reject")
def reject_message(property_id: int, message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Estate agent rejects a pending message.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or current_user.id != prop.estate_agent_id:
        raise HTTPException(status_code=403, detail="Only the estate agent can reject messages")
    msg = db.query(Message).filter(Message.id == message_id, Message.property_id == property_id).first()
    if not msg or msg.approval_status != 'pending':
        raise HTTPException(status_code=404, detail="Message not found or already processed")
    msg.approval_status = 'rejected'
    msg.status = 'rejected'
    db.commit()
    return {"message": "Message rejected"}

@router.post("/test-openai-moderation")
def test_openai_moderation(body: dict = Body(...)):
    text = body.get('text', '')
    try:
        print("Testing OpenAI moderation...")
        print(f"API Key present: {bool(os.getenv('OPENAI_API_KEY'))}")
        print(f"API Key first 5 chars: {os.getenv('OPENAI_API_KEY')[:5] if os.getenv('OPENAI_API_KEY') else 'None'}")
        result = ai_filter_message(text)
        return {"result": result}
    except Exception as e:
        print(f"Error in test endpoint: {str(e)}")
        return {"error": str(e)}

@router.get("/properties/{property_id}/messages")
def get_all_property_messages(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print("DEBUG: /properties/{property_id}/messages endpoint HIT")
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    # Allow estate agent, buyer, or seller to view all messages
    if current_user.id not in [prop.buyer_id, prop.seller_id, prop.estate_agent_id]:
        raise HTTPException(status_code=403, detail="Not authorized to view messages for this property")
    messages = db.query(Message).filter(Message.property_id == property_id).order_by(Message.timestamp).all()
    buyer_id = prop.buyer_id
    seller_id = prop.seller_id
    result = [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "property_id": m.property_id,
            "stage_id": m.stage_id,
            "content": m.content,
            "original_content": m.original_content,
            "filtered_content": m.filtered_content,
            "approved_content": m.approved_content,
            "approval_status": m.approval_status,
            "timestamp": m.timestamp,
            "status": m.status,
            "is_buyer_seller_message": (
                (m.sender_id == buyer_id and m.recipient_id == seller_id) or
                (m.sender_id == seller_id and m.recipient_id == buyer_id)
            )
        } for m in messages
    ]
    print("DEBUG: Returning messages:", result)
    return result

@router.patch("/properties/{property_id}/stages/reorder")
def reorder_property_stages(
    property_id: int,
    request: ReorderStagesRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reorder the stages for a property. Only allowed if timeline is not locked and user is a solicitor for the property.
    Accepts a list of stage IDs in the new order.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.timeline_locked:
        raise HTTPException(status_code=400, detail="Cannot reorder stages when timeline is locked")
    if not (current_user.id == prop.buyer_solicitor_id or current_user.id == prop.seller_solicitor_id):
        raise HTTPException(status_code=403, detail="Not authorized to reorder stages for this property")
    stages = db.query(PropertyStage).filter(PropertyStage.property_id == property_id).all()
    stage_id_set = set(s.id for s in stages)
    if set(request.stage_ids) != stage_id_set:
        raise HTTPException(status_code=400, detail="Stage IDs do not match current stages")
    for new_order, stage_id in enumerate(request.stage_ids):
        db.query(PropertyStage).filter(PropertyStage.id == stage_id, PropertyStage.property_id == property_id).update({"order": new_order})
    db.commit()
    return {"message": "Stages reordered successfully"} 