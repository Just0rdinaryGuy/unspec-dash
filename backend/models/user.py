from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9]+$", description="Username harus alfanumerik (ga boleh spasi atau simbol)")
    nik: str = Field(..., min_length=3, max_length=20, pattern=r"^\d+$", description="NIK harus numerik")
    full_name: Optional[str] = None
    role: str = Field(default="user", pattern="^(admin|developer|user|teknisi)$")
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    nik: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(admin|developer|user|teknisi)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str
