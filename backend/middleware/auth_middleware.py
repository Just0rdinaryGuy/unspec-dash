from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db, UserDB
from services.auth_service import AuthService
from models.auth import TokenData
from utils.security_helpers import is_within_allowed_location

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = AuthService.decode_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    token_data = TokenData(username=username)
    
    user = db.query(UserDB).filter(UserDB.username == token_data.username).first()
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    request: Request,
    current_user: UserDB = Depends(get_current_user)
):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    # Bypass lokasi jika ada header bypass keamanan (testing)
    if request.headers.get("X-Bypass-Security") == "true":
        return current_user

    # Bypass lokasi jika role adalah developer atau teknisi
    if current_user.role in ["developer", "teknisi"]:
        return current_user
        
    # Ambil lokasi dari request headers
    lat_header = request.headers.get("X-User-Latitude")
    lon_header = request.headers.get("X-User-Longitude")
    
    if not lat_header or not lon_header or lat_header == "null" or lon_header == "null":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="LOCATION_RESTRICTED: Izin lokasi diperlukan untuk mengakses sistem."
        )
        
    try:
        lat = float(lat_header)
        lon = float(lon_header)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="LOCATION_RESTRICTED: Format koordinat lokasi tidak valid."
        )
        
    if not is_within_allowed_location(lat, lon):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="LOCATION_RESTRICTED: Anda berada di luar wilayah operasional WOC Balikpapan."
        )
        
    return current_user

async def get_admin_user(current_user: UserDB = Depends(get_current_active_user)):
    if current_user.role not in ["leader", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user doesn't have enough privileges"
        )
    return current_user
