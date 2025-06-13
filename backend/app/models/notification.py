from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, func
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False, default="system")  # e.g. 'message', 'approval', 'system'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read = Column(Boolean, default=False) 