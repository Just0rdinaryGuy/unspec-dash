from sqlalchemy import Column, Integer, Date, TIMESTAMP, func
from database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class DailyReportDB(Base):
    """
    Tabel untuk menyimpan summary report harian.
    Data ini di-generate sekali per hari atau bisa di-trigger manual.
    """
    __tablename__ = "daily_reports"

    date = Column(Date, primary_key=True, index=True)  # Tanggal laporan (YYYY-MM-DD)
    total_saldo = Column(Integer, default=0)           # Total Unspec saat itu
    close = Column(Integer, default=0)                 # Total tiket closed hari itu
    saldo_lama = Column(Integer, default=0)            # Saldo hari sebelumnya
    target = Column(Integer, default=0)                # Target unspec
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

# Pydantic Models
class DailyReportBase(BaseModel):
    date: date
    total_saldo: int
    close: int
    saldo_lama: int
    target: int

class DailyReportCreate(DailyReportBase):
    pass

class DailyReportUpdate(BaseModel):
    total_saldo: Optional[int] = None
    close: Optional[int] = None
    saldo_lama: Optional[int] = None
    target: Optional[int] = None

class DailyReportResponse(DailyReportBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
