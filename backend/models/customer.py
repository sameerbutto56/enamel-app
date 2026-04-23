from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional, List
import uuid


class SavedAddress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str = "Home"  # Home, Work, Other
    full_name: str
    phone: str
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "Pakistan"
    is_default: bool = False


class CustomerRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class CustomerLogin(BaseModel):
    email: EmailStr
    password: str


class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class CustomerInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    password_hash: str
    addresses: List[SavedAddress] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CustomerPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: Optional[str] = None
    addresses: List[SavedAddress] = []
    created_at: datetime
