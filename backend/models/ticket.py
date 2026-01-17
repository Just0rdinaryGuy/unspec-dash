from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List

class ServiceTicket(BaseModel):
    """Model buat tiket service recovery"""
    id: Optional[int] = None
    tgl: date = Field(..., description="Tanggal ticket")
    sto: str = Field(..., description="STO lokasi")
    odp: str = Field(..., description="ODP yang bermasalah")
    nama_teknisi: str = Field(..., description="Nama teknisi yang handle")
    no_tiket: str = Field(..., description="Nomor tiket unik")
    redaman_awal: float = Field(..., description="Redaman sebelum perbaikan (dB)")
    redaman_akhir: Optional[float] = Field(None, description="Redaman setelah perbaikan (dB)")
    status_rfo: str = Field(..., description="Status RFO: OPEN, PROGRESS, KENDALA etc")
    ticket_status: str = Field(default="OPEN", description="Status Tiket: OPEN, CLOSED")
    
    # Field tambahan buat tracking
    nd: Optional[str] = Field(None, description="Subscriber ID yang kena masalah")
    keterangan: Optional[str] = Field(None, description="Catatan tambahan")
    created_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class TicketSummary(BaseModel):
    """Summary tiket buat dashboard"""
    total_tickets: int
    total_open: int
    total_progress: int
    total_close: int
    total_kendala: int
    avg_resolution_time: Optional[float] = Field(None, description="Rata-rata waktu resolusi dalam hari")

class ServiceTicketPage(BaseModel):
    """Response paginated buat tickets"""
    items: List[ServiceTicket]
    total: int
    page: int
    limit: int
