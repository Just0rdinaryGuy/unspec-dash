"""
Router untuk data import - upload Excel files
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
import tempfile
from datetime import datetime

from database import get_db
# Import dipindahin ke dalam function biar ga circular dependency

router = APIRouter(prefix="/api/data-import", tags=["data-import"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload")
async def upload_excel_files(
    file1: UploadFile = File(None, description="File Excel pertama (unspec-semesta atau ukur-massal)"),
    file2: UploadFile = File(None, description="File Excel kedua"),
    db: Session = Depends(get_db)
):
    """
    Upload 2 Excel files dan process untuk update database
    
    Notes:
    - Nama file bebas, akan di-detect otomatis berdasarkan struktur kolom
    - Strategy: TRUNCATE existing data, insert new data
    - Max size: 10MB per file
    """
    
    
    # Validasi ekstensi file
    files_to_process = [f for f in [file1, file2] if f is not None]
    
    if not files_to_process:
        raise HTTPException(status_code=400, detail="Tidak ada file yang diupload")

    for file in files_to_process:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} bukan Excel file (.xlsx/.xls)"
            )
    
    # Validasi ukuran file
    for file in files_to_process:
        file.file.seek(0, 2)  # loncat ke akhir
        size = file.file.tell()
        file.file.seek(0)  # reset ke awal
        
        if size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} terlalu besar (max 10MB)"
            )
    
    # Simpen file sementara
    temp_files = []
    try:
        for file in files_to_process:
            # Bikin file temp
            suffix = os.path.splitext(file.filename)[1]
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            
            # Tulis file yang diupload ke temp
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            
            # --- DEBUG: SIMPEN FILE BUAT ANALISA ---
            try:
                import shutil
                debug_dir = "debug_files"
                os.makedirs(debug_dir, exist_ok=True)
                debug_path = os.path.join(debug_dir, file.filename)
                shutil.copy(temp_file.name, debug_path)
                print(f"[DEBUG] Saved copy to {debug_path}")
            except Exception as e:
                print(f"[DEBUG] Failed to save copy: {e}")
            # ----------------------------------------
            
            temp_files.append(temp_file.name)
        
        # Tentuin mode based on jumlah file yang diupload
        if len(temp_files) == 1:
            # Mode single file -> cek apakah Ukur Massal
            from utils.excel_import import parse_ukur_massal_only, detect_file_type
            
            file_path = temp_files[0]
            ftype = detect_file_type(file_path)
            
            if ftype == 'ukur':
                # Update Redaman aja
                parsed_data = parse_ukur_massal_only(file_path)
                
                from services.real_data_service import RealDataService
                service = RealDataService(db)
                result = service.update_redaman_values(parsed_data)
                
                # --- Generate Report after Redaman Update ---
                from datetime import date
                today = date.today()
                report = service.generate_daily_report(today)
                result["report_generated"] = True
                result["report_summary"] = {
                    "total": report.total_saldo,
                    "close": report.close,
                    "target": report.target
                }
                # ------------------------------------------
                
                return JSONResponse(content=result)
            else:
                # File Unspec sendirian ga support partial update
                raise ValueError("Untuk update partial, hanya file 'Ukur Massal' yang didukung saat ini. Untuk full import, harap upload KEDUA file.")
                
        elif len(temp_files) == 2:
            # Mode full import (gabung 2 file)
            from utils.excel_import import parse_and_merge_files
            parsed_data = parse_and_merge_files(
                file_path_1=temp_files[0],
                file_path_2=temp_files[1]
            )
            
            # Import ke DB lewat Service
            from services.real_data_service import RealDataService
            service = RealDataService(db)
            result = service.import_data(parsed_data)
            
            # --- Generate Report Otomatis buat Hari Ini ---
            # Pake tanggal 'today' atau tanggal dari import?
            # Idealnya import itu buat hari ini juga
            from datetime import date
            today = date.today()
            report = service.generate_daily_report(today)
            # Tambahin status report ke result
            result["report_generated"] = True
            result["report_summary"] = {
                "total": report.total_saldo,
                "close": report.close,
                "target": report.target
            }
            # ------------------------------------------
            
            return JSONResponse(content=result)
            
        else:
             raise ValueError("Harap upload 1 file (Ukur Massal saja) atau 2 file (Unspec + Ukur) sekaligus.")
        
    except ValueError as e:
        # Error validasi (misal: struktur Excel salah)
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        # Error tak terduga
        raise HTTPException(
            status_code=500,
            detail=f"Error processing files: {str(e)}"
        )
    
    finally:
        # Bersihin temp files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass

@router.get("/status")
def get_import_status(db: Session = Depends(get_db)):
    """
    Get current database status
    """
    total = db.query(NetworkNodeDB).count()
    spec = db.query(NetworkNodeDB).filter(NetworkNodeDB.spec_status == "SPEC").count()
    unspec = total - spec
    
    # Get last import timestamp (from created_at of most recent record)
    last_record = db.query(NetworkNodeDB).order_by(NetworkNodeDB.created_at.desc()).first()
    
    return {
        "total_nodes": total,
        "spec_count": spec,
        "unspec_count": unspec,
        "last_import": last_record.created_at.isoformat() if last_record else None
    }
