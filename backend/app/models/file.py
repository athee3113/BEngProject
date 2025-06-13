from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, text, JSON, TypeDecorator
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class ReviewStatus(str, enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    DENIED = 'denied'

class DocumentType(str, enum.Enum):
    # User documents
    PROOF_OF_ID = 'proof_of_id'
    PROOF_OF_ADDRESS = 'proof_of_address'
    SOURCE_OF_FUNDS = 'source_of_funds'
    
    # Property documents
    TITLE_DEEDS = 'title_deeds'
    EPC = 'epc'
    TITLE_PLAN = 'title_plan'
    PROPERTY_PHOTOS = 'property_photos'
    
    # Conveyancing case documents
    DRAFT_CONTRACT = 'draft_contract'
    LOCAL_AUTHORITY_SEARCH = 'local_authority_search'
    WATER_SEARCH = 'water_search'
    ENVIRONMENTAL_SEARCH = 'environmental_search'
    SURVEY_REPORT = 'survey_report'
    MORTGAGE_OFFER = 'mortgage_offer'
    CONTRACT = 'contract'
    COMPLETION_STATEMENT = 'completion_statement'
    TRANSFER_DEED = 'transfer_deed'
    LAND_REGISTRY = 'land_registry'
    LEASE_AGREEMENT = 'lease_agreement'
    ENERGY_CERTIFICATE = 'energy_certificate'
    FLOOD_RISK_ASSESSMENT = 'flood_risk_assessment'
    OTHER = 'other'

class CaseInsensitiveEnum(TypeDecorator):
    impl = String
    cache_ok = True

    def __init__(self, enum_class):
        self.enum_class = enum_class
        super().__init__()

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.lower()
            for member in self.enum_class:
                if member.value == value:
                    return member.value
        return value.value if isinstance(value, self.enum_class) else value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.lower()
            for member in self.enum_class:
                if member.value == value:
                    return member
        return value

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Optional relationships - at least one must be set
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For user-specific documents
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)  # For property-specific documents
    conveyancing_case_id = Column(Integer, ForeignKey("conveyancing_cases.id"), nullable=True)  # For case-specific documents
    
    uploaded_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    description = Column(String, nullable=True)
    document_type = Column(CaseInsensitiveEnum(DocumentType), nullable=False)
    notes = Column(Text, nullable=True)
    review_status = Column(Enum(ReviewStatus), nullable=True, default=ReviewStatus.PENDING)

    # New fields for document management
    expires_at = Column(DateTime(timezone=True), nullable=True)  # For tracking document validity
    visible_to = Column(JSON, nullable=True)  # List of roles that can view this document
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who reviewed the document
    reviewed_at = Column(DateTime(timezone=True), nullable=True)  # When the document was reviewed

    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_files")
    user = relationship("User", foreign_keys=[user_id], back_populates="user_files")
    property = relationship("Property", back_populates="property_files")
    conveyancing_case = relationship("ConveyancingCase", back_populates="documents")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id], back_populates="reviewed_files") 