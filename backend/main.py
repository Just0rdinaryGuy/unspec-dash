from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pathlib import Path

# Cari file .env secara dinamis (prioritaskan root proyek induk, lalu folder backend)
base_dir = Path(__file__).resolve().parent
dotenv_path = base_dir.parent / ".env"
if not dotenv_path.exists():
    dotenv_path = base_dir / ".env"

load_dotenv(dotenv_path=dotenv_path, override=True)

import sys
print(f"DEBUG_ENV: dotenv_path={dotenv_path}, exists={dotenv_path.exists()}", file=sys.stderr)
print(f"DEBUG_ENV: DATABASE_URL={os.getenv('DATABASE_URL')}", file=sys.stderr)
print(f"DEBUG_ENV: CORS_ORIGINS={os.getenv('CORS_ORIGINS')}", file=sys.stderr)

# Import router yang udah kita bikin
from routers import dashboard, data_explorer, tickets, data_import, auth, users, report, bot_telegram

app = FastAPI(
    title="Network Monitoring",
    description="API buat monitoring jaringan - signal quality & ticket management",
    version="1.0.0"
)

# CORS biar frontend bisa hit API
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware Pembatasan Waktu Operasional (08:00 - 22:00 WITA)
from fastapi import Request
from fastapi.responses import JSONResponse
from utils.security_helpers import is_within_operational_hours
from services.auth_service import AuthService

@app.middleware("http")
async def check_operational_hours(request: Request, call_next):
    # Bypass OPTIONS request untuk preflight CORS (mencegah CORS 403 Forbidden)
    if request.method == "OPTIONS":
        return await call_next(request)

    # Bypass jika ada header bypass keamanan (testing)
    if request.headers.get("X-Bypass-Security") == "true":
        return await call_next(request)

    path = request.url.path
    
    # Path yang dikecualikan
    excluded_paths = [
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/auth/login",
        "/api/auth/login/json",
        "/api/auth/register"
    ]
    
    # Webhook Bot Telegram dan path publik tidak dibatasi waktu
    if path.startswith("/api/bot") or path in excluded_paths:
        return await call_next(request)
        
    # Check jam operasional WITA
    if not is_within_operational_hours():
        # Cek apakah user adalah developer atau teknisi (bypass)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = AuthService.decode_token(token)
                if payload and payload.get("role") in ["developer", "teknisi"]:
                    return await call_next(request)
            except Exception:
                pass
                
        return JSONResponse(
            status_code=403,
            content={"detail": "TIME_RESTRICTED: Aplikasi WOC hanya dapat diakses pada jam 08:00 - 22:00 WITA."}
        )
        
    return await call_next(request)

from database import engine, Base
from models.team import TeamDB 
from models.attendance import AttendanceDB # Register AttendanceDB

# Buat tabel kalau belum ada
Base.metadata.create_all(bind=engine)

# Daftarin semua router (prefix sudah ada di router definition)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(data_explorer.router)
app.include_router(tickets.router)
app.include_router(data_import.router)
app.include_router(report.router)
app.include_router(bot_telegram.router)

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Network Monitoring API",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    """Health check buat docker/kubernetes"""
    return {"status": "healthy"}
