from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from database import get_db, UserDB
from services.auth_service import AuthService, ACCESS_TOKEN_EXPIRE_MINUTES
from models.auth import Token
from models.user import UserLogin
from datetime import timedelta

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

# Support Form Data (Swagger) dan JSON (Frontend)
@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not AuthService.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau Password Salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda Tidak Aktif. Silahkan Hubungi Admin.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Alternative endpoint JSON buat kemudahan frontend
@router.post("/login/json", response_model=Token)
async def login_json(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(UserDB).filter(UserDB.username == login_data.username).first()
    if not user or not AuthService.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau Password Salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

from models.user import UserCreate, UserResponse

@router.post("/register", response_model=UserResponse)
async def register(
    user: UserCreate, 
    db: Session = Depends(get_db)
):
    # Cek apakah username udah ada
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username Sudah Terdaftar")
    
    # Cek apakah nik udah ada
    db_nik = db.query(UserDB).filter(UserDB.nik == user.nik).first()
    if db_nik:
        raise HTTPException(status_code=400, detail="NIK Sudah Terdaftar")
    
    hashed_password = AuthService.get_password_hash(user.password)
    # Default role adalah user
    new_user = UserDB(
        username=user.username,
        nik=user.nik,
        password_hash=hashed_password,
        full_name=user.full_name,
        role="helpdesk",
        is_active=False # User harus diapprove admin dulu
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
