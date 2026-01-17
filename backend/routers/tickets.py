"""
Router buat ticket management
Endpoint buat service recovery tracking
TEMPORARY: Pake data real sampe ticket data beneran terintegrasi
"""

from fastapi import APIRouter, Query
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import APIRouter, Query, Depends
from models.ticket import ServiceTicket, TicketSummary, ServiceTicketPage
from database import get_db
from services.real_data_service import RealDataService

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

@router.get("/service-recovery", response_model=ServiceTicketPage)
def get_service_recovery_tickets(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, PROGRESS, CLOSE, KENDALA"),
    sto: Optional[str] = Query(None, description="Filter by STO"),
    date_filter: Optional[date] = Query(None, description="Filter by Import Date"),
    spec_status: Optional[str] = Query(None, description="Filter by SPEC/UNSPEC"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=500, description="Items per page"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    search: Optional[str] = Query(None, description="Search by ND or ODP"),
    db: Session = Depends(get_db)
):
    """
    Ambil list service recovery tickets from Real Data (Paginated)
    """
    service = RealDataService(db)
    return service.get_service_recovery_tickets(status, sto, date_filter, spec_status, page, limit, sort_by, sort_order, search)

@router.get("/service-recovery/export")
def export_service_recovery_tickets(
    status: Optional[str] = Query(None),
    sto: Optional[str] = Query(None),
    date_filter: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Export Service Recovery Tickets jadi Excel"""
    service = RealDataService(db)
    df = service.export_service_recovery_tickets(status, sto, date_filter, search)
    
    # Generate Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='ServiceTickets')
        # Auto-adjust lebar kolom
        worksheet = writer.sheets['ServiceTickets']
        for i, col in enumerate(df.columns):
            column_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
            worksheet.set_column(i, i, column_len)
            
    output.seek(0)
    
    date_str = date.today().strftime('%d-%m-%Y')
    headers = {
        'Content-Disposition': f'attachment; filename="Status Ticket Unspec {date_str}.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.get("/dates", response_model=List[date])
def get_available_dates(db: Session = Depends(get_db)):
    """Ambil list tanggal import yang tersedia"""
    service = RealDataService(db)
    return service.get_available_dates()

from pydantic import BaseModel
class TicketUpdate(BaseModel):
    sto: Optional[str] = None
    odp: Optional[str] = None
    no_tiket: Optional[str] = None
    nama_teknisi: Optional[str] = None
    status_rfo: Optional[str] = None
    ticket_status: Optional[str] = None

@router.put("/service-recovery/{ticket_id}", response_model=ServiceTicket)
def update_ticket(
    ticket_id: int, 
    update_data: TicketUpdate,
    db: Session = Depends(get_db)
):
    """Update detail ticket"""
    service = RealDataService(db)
    # Convert Pydantic jadi dict, skip yang None
    updates = {k: v for k, v in update_data.dict().items() if v is not None}
    
    updated_ticket = service.update_ticket(ticket_id, updates)
    if not updated_ticket:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return updated_ticket

@router.get("/summary", response_model=TicketSummary)
def get_ticket_summary(db: Session = Depends(get_db)):
    """
    Ambil summary tiket buat dashboard from Real Data
    """
    service = RealDataService(db)
    return service.get_ticket_summary()

@router.get("/stats/by-teknisi")
def get_stats_by_teknisi():
    """
    Statistik ticket per teknisi
    placeholder: return list kosong
    """
    return {
        "data": []
    }

@router.get("/stats/by-sto")
def get_stats_by_sto():
    """
    Statistik ticket per STO
    TEMPORARY: Return kosong - belum ada integrasi data real
    """
    # TODO: Implement pake data real
    return {
        "data": [],
        "total_sto": 0
    }
