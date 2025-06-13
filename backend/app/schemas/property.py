from typing import Optional
from pydantic import BaseModel

class PropertyBase(BaseModel):
    address: str
    status: Optional[str] = "In Progress"
    type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    price: Optional[float] = None
    tenure: Optional[str] = None
    completion_date: Optional[str] = None
    buyer_solicitor_id: Optional[int] = None
    seller_solicitor_id: Optional[int] = None
    estate_agent_id: Optional[int] = None
    seller_id: Optional[int] = None
    timeline_locked: Optional[bool] = False
    timeline_approved_by_buyer_solicitor: Optional[bool] = False
    timeline_approved_by_seller_solicitor: Optional[bool] = False

class PropertyCreate(PropertyBase):
    buyer_id: int

class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    price: Optional[float] = None
    tenure: Optional[str] = None
    completion_date: Optional[str] = None
    buyer_solicitor_id: Optional[int] = None
    seller_solicitor_id: Optional[int] = None
    estate_agent_id: Optional[int] = None
    seller_id: Optional[int] = None

class PropertyResponse(PropertyBase):
    id: int
    buyer_id: int
    buyer_solicitor_id: Optional[int]
    seller_solicitor_id: Optional[int]
    estate_agent_id: Optional[int]
    seller_id: Optional[int]
    timeline_locked: bool = False
    timeline_approved_by_buyer_solicitor: bool = False
    timeline_approved_by_seller_solicitor: bool = False
    class Config:
        orm_mode = True 