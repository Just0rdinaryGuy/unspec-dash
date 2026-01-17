from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime as dt, timedelta, time
from database import get_db, NetworkNodeDB
from models.report import DailyReportDB, DailyReportResponse, DailyReportUpdate

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

@router.get("/", response_model=List[DailyReportResponse])
async def get_reports(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db)
):
    """
    Ambil laporan harian buat bulan dan tahun tertentu
    """
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
        
    reports = db.query(DailyReportDB).filter(
        DailyReportDB.date >= start_date,
        DailyReportDB.date < end_date
    ).order_by(DailyReportDB.date).all()
    
    return reports

@router.post("/generate", response_model=DailyReportResponse)
async def generate_today_report(
    target: int = Query(127, description="Target daily unspec"),
    report_date: Optional[date] = Query(None, description="Date to generate report for (default: Today)"),
    db: Session = Depends(get_db)
):
    """
    Generate atau update report buat HARI INI (atau tanggal tertentu).
    - Total Saldo: Total semua node saat ini
    - Close: Jumlah node CLOSED
    - Saldo Lama: Total - Close (sisa yang belum closed)
    """
    today = report_date if report_date else date.today()
    
    from services.real_data_service import RealDataService
    service = RealDataService(db)
    
    try:
        return service.generate_daily_report(today, target)
    except Exception as e:
        print(f"ERROR GENERATING REPORT: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.put("/{report_date}", response_model=DailyReportResponse)
async def update_report(
    report_date: date,
    update_data: DailyReportUpdate,
    db: Session = Depends(get_db)
):
    """
    Manually update a report entry (e.g. to fix Target or adjust numbers)
    """
    report = db.query(DailyReportDB).filter(DailyReportDB.date == report_date).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(report, key, value)
        
    db.commit()
    db.refresh(report)
    return report

from fastapi.responses import StreamingResponse

@router.get("/export")
async def export_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db)
):
    """
    Export detailed Excel report with Chart and Raw Data Sheets
    """
    from services.real_data_service import RealDataService
    service = RealDataService(db)
    
    try:
        buffer = service.export_monthly_report(month, year)
        
        filename = f"Laporan_Unspec_{year}-{month:02d}.xlsx"
        
        return StreamingResponse(
            buffer, 
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
            
    except Exception as e:
        print(f"EXPORT ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
