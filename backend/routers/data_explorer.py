"""
Router buat data explorer
Endpoint buat table dengan high-density data network nodes
"""

from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from models.network import NetworkNode
from services.real_data_service import RealDataService
from database import get_db
from datetime import datetime

router = APIRouter(prefix="/api/data-explorer", tags=["data-explorer"])

@router.get("/nodes")
def get_network_nodes(
    page: int = Query(1, ge=1, description="Halaman yang mau ditampilin"),
    limit: int = Query(50, ge=1, le=500, description="Jumlah data per halaman"),
    sto: Optional[str] = Query(None, description="Filter by STO (pisahkan dengan koma untuk multiple)"),
    sector: Optional[str] = Query(None, description="Filter by Sektor"),
    search: Optional[str] = Query(None, description="Search by ND atau ODP"),
    redaman_status: Optional[str] = Query(None, description="Filter by SPEC/UNSPEC"),
    db: Session = Depends(get_db)
):
    """
    Ambil network nodes dengan pagination dan filter dari database real
    
    Query parameters:
    - sto: filter by STO (pisahkan dengan koma untuk multiple)
    
    Returns:
    - data: list network nodes
    - total: total data setelah filter
    - page: halaman saat ini
    - total_pages: total halaman
    """
    skip = (page - 1) * limit
    
    # Ambil data dari database via service
    service = RealDataService(db)
    nodes, total = service.get_network_nodes(
        skip=skip,
        limit=limit,
        sto=sto,
        sector=sector,
        search=search,
        spec_status=redaman_status
    )
    
    # Hitung total halaman
    total_pages = (total + limit - 1) // limit  # pembulatan ke atas
    
    return {
        "data": nodes,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@router.get("/export")
def export_network_nodes(
    sto: Optional[str] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
    redaman_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Export semua data (buat download CSV)
    Return semua data tanpa pagination
    """
    service = RealDataService(db)
    nodes = service.export_all_nodes(
        sto=sto,
        sector=sector,
        spec_status=redaman_status
    )
    
    return {
        "data": nodes,
        "total": len(nodes),
        "exported_at": datetime.now().isoformat()
    }

@router.get("/export-excel")
def export_excel_nodes(
    sto: Optional[str] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
    redaman_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Export data to Excel (.xlsx)
    """
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    
    service = RealDataService(db)
    nodes = service.export_all_nodes(
        sto=sto,
        sector=sector,
        spec_status=redaman_status,
        search=search
    )
    
    # Convert to DataFrame
    data = [node.model_dump() for node in nodes]
    df = pd.DataFrame(data)
    
    # Rename columns if needed or select specific columns
    if not df.empty:
        column_mapping = {
            "node_id": "Node ID",
            "port": "Port",
            "nd": "ND",
            "status": "Status",
            "rx_power": "Rx Power",
            "sto": "STO",
            "sector": "Sector",
            "odp": "ODP",
            "hvc_category": "HVC Category",
            "redaman_status": "Redaman Status"
        }
        # Rename available columns
        df = df.rename(columns=column_mapping)
        
        # Select columns to export (intersection with available columns)
        desired_columns = list(column_mapping.values())
        existing_columns = [col for col in desired_columns if col in df.columns]
        df = df[existing_columns]
    
    # Generate Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Network Data')
    
    output.seek(0)
    
    date_str = datetime.now().strftime('%d-%m-%Y')
    filename = f"Data Unspec {date_str}.xlsx"
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )

@router.get("/filters")
def get_available_filters(db: Session = Depends(get_db)):
    """
    Ambil list filter yang available dari database real
    Buat populate dropdown di frontend
    """
    service = RealDataService(db)
    filter_options = service.get_filter_options()
    
    return {
        "sto_list": filter_options["sto"],
        "sector_list": filter_options["sector"],
        "redaman_status_list": filter_options["spec_status"],
        "status_list": ["ONLINE", "OFFLINE", "KENDALA"]  # Status list static
    }
