from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
import uuid


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    department_id: str | None = None
    created_at: datetime


class UserInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "admin"
    department_id: str | None = None
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class EmployeeUpsertRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    department_id: str = Field(..., min_length=1, max_length=40)
    password: str = Field(..., min_length=6, max_length=100)
