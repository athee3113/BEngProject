from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class UserRole(enum.Enum):
    BUYER = "buyer"
    SELLER = "seller"
    SOLICITOR = "solicitor"
    ESTATE_AGENT = "estate_agent"

class User(Base):
    __tablename__ = "users"  

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    phone_number = Column(String, nullable=False)  # Required for all users
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # New field for verification status
    verified_at = Column(DateTime(timezone=True), nullable=True)  # New field for verification timestamp
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Optional fields for solicitors and estate agents
    company_name = Column(String, nullable=True)
    company_address = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)  # For solicitors: SRA number, for agents: company registration

    # Relationships will be set up after all models are defined
    uploaded_files = None
    user_files = None
    reviewed_files = None  # New relationship for files reviewed by this user
    buyer_properties = None
    seller_properties = None
    buyer_solicitor_properties = None
    seller_solicitor_properties = None
    agent_properties = None
    buyer_cases = None
    seller_cases = None
    buyer_solicitor_cases = None
    seller_solicitor_cases = None
    agent_cases = None

# Import models after User class is defined
from app.models.file import File
from app.models.property import Property
from app.models.conveyancing_case import ConveyancingCase

# Set up relationships after all models are defined
User.uploaded_files = relationship("File", foreign_keys="File.uploaded_by", back_populates="uploader")
User.user_files = relationship("File", foreign_keys="File.user_id", back_populates="user")
User.reviewed_files = relationship("File", foreign_keys="File.reviewed_by_id", back_populates="reviewer")
User.buyer_properties = relationship("Property", foreign_keys="Property.buyer_id", back_populates="buyer")
User.seller_properties = relationship("Property", foreign_keys="Property.seller_id", back_populates="seller")
User.buyer_solicitor_properties = relationship("Property", foreign_keys="Property.buyer_solicitor_id", back_populates="buyer_solicitor")
User.seller_solicitor_properties = relationship("Property", foreign_keys="Property.seller_solicitor_id", back_populates="seller_solicitor")
User.agent_properties = relationship("Property", foreign_keys="Property.estate_agent_id", back_populates="estate_agent")
User.buyer_cases = relationship("ConveyancingCase", foreign_keys="ConveyancingCase.buyer_id", back_populates="buyer")
User.seller_cases = relationship("ConveyancingCase", foreign_keys="ConveyancingCase.seller_id", back_populates="seller")
User.buyer_solicitor_cases = relationship("ConveyancingCase", foreign_keys="ConveyancingCase.buyer_solicitor_id", back_populates="buyer_solicitor")
User.seller_solicitor_cases = relationship("ConveyancingCase", foreign_keys="ConveyancingCase.seller_solicitor_id", back_populates="seller_solicitor")
User.agent_cases = relationship("ConveyancingCase", foreign_keys="ConveyancingCase.estate_agent_id", back_populates="estate_agent")
