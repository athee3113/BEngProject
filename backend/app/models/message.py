from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, text
from sqlalchemy.sql import func
from app.core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    stage_id = Column(Integer, nullable=False)  # Assuming stages are identified by integer IDs
    # Old content field (deprecated for new workflow)
    content = Column(Text, nullable=True)
    # New fields for agent approval workflow
    original_content = Column(Text, nullable=True)
    filtered_content = Column(Text, nullable=True)
    approved_content = Column(Text, nullable=True)
    approval_status = Column(String, nullable=False, default="pending")  # 'pending', 'approved'
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    status = Column(String, nullable=False, default="pending")  # pending, approved, delivered 