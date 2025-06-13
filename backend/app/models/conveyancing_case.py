from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class CaseStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ConveyancingCase(Base):
    __tablename__ = "conveyancing_cases"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buyer_solicitor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_solicitor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    estate_agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.PENDING)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    completion_date = Column(DateTime, nullable=True)

    # Relationships
    property = relationship("Property", back_populates="conveyancing_cases")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_cases")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="seller_cases")
    buyer_solicitor = relationship("User", foreign_keys=[buyer_solicitor_id], back_populates="buyer_solicitor_cases")
    seller_solicitor = relationship("User", foreign_keys=[seller_solicitor_id], back_populates="seller_solicitor_cases")
    estate_agent = relationship("User", foreign_keys=[estate_agent_id], back_populates="agent_cases")
    documents = relationship("File", back_populates="conveyancing_case") 