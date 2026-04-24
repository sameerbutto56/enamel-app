from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

class Logo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1)
    image_url: str = Field(..., min_length=1)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LogoCreate(BaseModel):
    name: str
    image_url: str
