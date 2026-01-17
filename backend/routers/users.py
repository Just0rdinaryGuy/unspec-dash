from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db, UserDB
from models.user import UserResponse, UserCreate, UserUpdate
from middleware.auth_middleware import get_admin_user, get_current_active_user
from services.auth_service import AuthService

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

# Admin only: List all users
@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_admin_user)
):
    query = db.query(UserDB)
    
    # If admin (not developer), hide developers
    if current_user.role != "developer":
        query = query.filter(UserDB.role != "developer")
        
    users = query.offset(skip).limit(limit).all()
    return users

# Admin only: Create user
@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate, 
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_admin_user)
):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username Sudah Terdaftar")
    
    db_nik = db.query(UserDB).filter(UserDB.nik == user.nik).first()
    if db_nik:
        raise HTTPException(status_code=400, detail="NIK Sudah Terdaftar")
    
    hashed_password = AuthService.get_password_hash(user.password)
    
    # Validation: Only developer can create developer
    if user.role == "developer" and current_user.role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Hanya Developer yang dapat membuat akun Developer"
        )

    db_user = UserDB(
        username=user.username,
        nik=user.nik,
        password_hash=hashed_password,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Get current user profile
@router.get("/me", response_model=UserResponse)
async def read_user_me(current_user: UserDB = Depends(get_current_active_user)):
    return current_user

# Admin only: Update user
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_admin_user)
):
    db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = AuthService.get_password_hash(update_data["password"])
        del update_data["password"]
    
    for key, value in update_data.items():
        if key == "role" and value == "developer" and current_user.role != "developer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Hanya Developer yang dapat memberikan role Developer"
            )
        setattr(db_user, key, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Admin only: Delete user
@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_admin_user)
):
    db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
    if db_user.id == current_user.id:
        raise HTTPException(status_code=403, detail="Anda tidak dapat menghapus akun sendiri")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User berhasil dihapus"}
