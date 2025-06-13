from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class PropertyStatus(enum.Enum):
    AVAILABLE = "available"
    UNDER_OFFER = "under_offer"
    SOLD = "sold"
    WITHDRAWN = "withdrawn"

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    postcode = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(Enum(PropertyStatus), nullable=False, default=PropertyStatus.AVAILABLE)
    description = Column(String, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    square_footage = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Unique identifiers for property traceability
    uprn = Column(String, nullable=True, unique=True, index=True)  # Unique Property Reference Number
    land_registry_title_number = Column(String, nullable=True, unique=True, index=True)  # Land Registry title number

    # Optional fields
    property_type = Column(String, nullable=True)  # e.g., 'house', 'flat', 'bungalow'
    tenure = Column(String, nullable=True)  # e.g., 'freehold', 'leasehold'
    year_built = Column(Integer, nullable=True)
    epc_rating = Column(String, nullable=True)

    # Relationships
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    buyer_solicitor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    seller_solicitor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    estate_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_properties")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="seller_properties")
    buyer_solicitor = relationship("User", foreign_keys=[buyer_solicitor_id], back_populates="buyer_solicitor_properties")
    seller_solicitor = relationship("User", foreign_keys=[seller_solicitor_id], back_populates="seller_solicitor_properties")
    estate_agent = relationship("User", foreign_keys=[estate_agent_id], back_populates="agent_properties")

    # File and case relationships
    property_files = relationship("File", back_populates="property")
    conveyancing_cases = relationship("ConveyancingCase", back_populates="property")
    stages = relationship("PropertyStage", back_populates="property", cascade="all, delete-orphan")

    # Collaborative timeline fields
    timeline_approved_by_buyer_solicitor = Column(Boolean, default=False, nullable=False)
    timeline_approved_by_seller_solicitor = Column(Boolean, default=False, nullable=False)
    timeline_locked = Column(Boolean, default=False, nullable=False)

class PropertyStage(Base):
    __tablename__ = "property_stages"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    stage = Column(String, nullable=False)  # e.g., "Offer Accepted"
    status = Column(String, nullable=False, default="pending")  # pending, in-progress, completed
    description = Column(String, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    completion_date = Column(DateTime(timezone=True), nullable=True)
    responsible = Column(String, nullable=True)  # Client, Solicitor, Agent
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True))

    # Collaborative Timeline Fields
    is_draft = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, nullable=False, default=0)
    responsible_role = Column(String, nullable=True)

    property = relationship("Property", back_populates="stages") 