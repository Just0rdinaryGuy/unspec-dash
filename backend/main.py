from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import router yang udah kita bikin
from routers import dashboard, data_explorer, tickets, data_import, auth, users, report

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

from database import engine, Base
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
