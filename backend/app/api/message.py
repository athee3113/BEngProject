from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.message import Message
from app.models.user import User
from app.models.property import Property
from datetime import datetime
from typing import List
from app.core.security import get_current_user
from app.models.notification import Notification

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ai_moderation_filter(content: str) -> bool:
    # Placeholder for AI moderation logic
    # Return True if message passes moderation, False otherwise
    return True

@router.post("/messages/send")
def send_message(
    sender_id: int,
    recipient_id: int,
    property_id: int,
    stage_id: int,
    content: str,
    db: Session = Depends(get_db)
):
    # AI moderation
    if not ai_moderation_filter(content):
        raise HTTPException(status_code=400, detail="Message did not pass moderation.")
    # Get sender and recipient users
    sender = db.query(User).filter(User.id == sender_id).first()
    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not sender or not recipient:
        raise HTTPException(status_code=404, detail="Sender or recipient not found.")
    
    # Create message with approved status
    message = Message(
        sender_id=sender_id,
        recipient_id=recipient_id,
        property_id=property_id,
        stage_id=stage_id,
        content=content,
        status="approved",  # Always set to approved
        approval_status="approved"  # Ensure approval_status is also set to approved
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return {"message": "Message sent successfully.", "id": message.id}

@router.post("/messages/approve/{message_id}")
def approve_message(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")
    message.status = "approved"
    db.commit()
    # Notify the recipient that their message was approved and delivered
    notif = Notification(
        user_id=message.recipient_id,
        property_id=message.property_id,
        message="A message has been approved and delivered to you.",
        type="message"
    )
    db.add(notif)
    # Notify the sender that their message was delivered (for buyers/solicitors)
    notif_sender = Notification(
        user_id=message.sender_id,
        property_id=message.property_id,
        message="Your message was approved and delivered to the recipient.",
        type="delivered"
    )
    db.add(notif_sender)
    db.commit()
    return {"message": "Message approved and delivered."}

@router.get("/messages/property/{property_id}")
def get_messages_for_property(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(Message).filter(Message.property_id == property_id).order_by(Message.timestamp).all()
    result = []
    for m in messages:
        # Show message if approved, or if the current user is the sender
        if m.status == "approved" or m.sender_id == current_user.id:
            result.append({
                "id": m.id,
                "sender_id": m.sender_id,
                "recipient_id": m.recipient_id,
                "property_id": m.property_id,
                "stage_id": m.stage_id,
                "content": m.content,
                "timestamp": m.timestamp,
                "status": m.status
            })
    return result

@router.get("/messages/pending/{property_id}")
def get_pending_messages(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user is estate agent for this property
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or prop.estate_agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view pending messages for this property")

    # Get all pending messages for this property
    messages = db.query(Message).filter(
        Message.property_id == property_id,
        Message.status == "pending"
    ).order_by(Message.timestamp.desc()).all()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "property_id": m.property_id,
            "stage_id": m.stage_id,
            "content": m.content,
            "timestamp": m.timestamp,
            "status": m.status
        }
        for m in messages
    ]

@router.post("/messages/reject/{message_id}")
def reject_message(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is estate agent for this property
    prop = db.query(Property).filter(Property.id == message.property_id).first()
    if not prop or prop.estate_agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject messages for this property")

    message.status = "rejected"
    db.commit()
    return {"message": "Message rejected"} 