from pydantic import BaseModel, EmailStr
from typing import Literal

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: Literal['Buyer', 'Seller', 'Solicitor', 'Estate Agent']

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: Literal['Buyer', 'Seller', 'Solicitor', 'Estate Agent']

    class Config:
        orm_mode = True