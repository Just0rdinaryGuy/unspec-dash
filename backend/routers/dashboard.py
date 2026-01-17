"""
Router buat endpoint dashboard
Ngasih data summary, HVC distribution, status kurma, dan ODP list
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.network import NetworkSummary, HVCDistribution, StatusKurma, ODPInfo
from services.real_data_service import RealDataService
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=NetworkSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Ambil statistik summary dashboard dari database real"""
    service = RealDataService(db)
    return service.get_dashboard_summary()


@router.get("/hvc-pivot", response_model=List[HVCDistribution])
def get_hvc_pivot(db: Session = Depends(get_db)):
    """Get HVC distribution per STO dari database"""
    service = RealDataService(db)
    return service.get_hvc_pivot()


@router.get("/status-kurma", response_model=List[StatusKurma])
def get_status_kurma(db: Session = Depends(get_db)):
    """Get SPEC/UNSPEC distribution per STO dari database"""
    service = RealDataService(db)
    return service.get_status_kurma()


@router.get("/odp-list", response_model=List[ODPInfo])
def get_odp_list(limit: int = 50, db: Session = Depends(get_db)):
    """Ambil list ODP dengan jumlah subscriber dari database"""
    service = RealDataService(db)
    return service.get_odp_list(limit=limit)
