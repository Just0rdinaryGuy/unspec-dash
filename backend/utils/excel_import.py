"""
Refactored data import - fungsi reusable buat processing Excel
Validasi based on struktur Excel, bukan nama file
"""
import pandas as pd
from datetime import datetime
from typing import Dict, Tuple, List, Any, Optional


# Konstanta
SPEC_MIN = -24.89
SPEC_MAX = -13.5
ERROR_CODES = [-500, -501, -502, -503, -504]

# Kolom yang diharapkan buat validasi
UNSPEC_SEMESTA_COLUMNS = ['No', 'CMDF', 'SEKTOR', 'ND', 'ODP', 'SHELF|SLOT|PORT| ONU ID', 
                          'ONU RX POWER UKUR ULANG', 'FLAG HVC', 'NODE ID(NODE IP)']
UKUR_MASSAL_COLUMNS = ['ND', 'ONU RX POWER']

def determine_spec_status(rx_power):
    """Tentuin SPEC atau UNSPEC"""
    if rx_power is None or rx_power in ERROR_CODES:
        return "UNSPEC"
    if rx_power > SPEC_MAX or rx_power < SPEC_MIN:
        return "UNSPEC"
    return "SPEC"

def find_excel_header_row(file_path: str, expected_keywords: List[str]) -> int:
    """
    Mencari baris header terbaik di dalam 15 baris pertama berkas Excel.
    Mengembalikan index baris header (0-indexed). Jika tidak ditemukan, kembalikan 0.
    """
    try:
        df = pd.read_excel(file_path, header=None, nrows=15)
        best_row = 0
        max_matches = 0
        
        for idx, row in df.iterrows():
            row_str = [str(val).upper().strip() for val in row if pd.notna(val)]
            matches = 0
            for keyword in expected_keywords:
                if any(keyword.upper() in val for val in row_str):
                    matches += 1
            if matches > max_matches:
                max_matches = matches
                best_row = idx
                
        if max_matches >= 2:
            return best_row
        return 0
    except:
        return 0

def detect_file_info(file_path: str) -> Tuple[str, Optional[int]]:
    """
    Mendeteksi tipe file ('unspec' atau 'ukur') beserta index baris header-nya.
    Jika file 'ukur' tidak memiliki header, mengembalikan ('ukur', None).
    """
    try:
        # 1. Cari header unspec-semesta
        unspec_keywords = ['SEKTOR', 'ND', 'ODP', 'RX POWER', 'ONU RX POWER', 'NOMOR TIKET', 'STATUS TIKET']
        unspec_header = find_excel_header_row(file_path, unspec_keywords)
        
        # Coba baca dengan header tersebut untuk verifikasi
        df_unspec = pd.read_excel(file_path, header=unspec_header, nrows=2)
        has_sektor = any('SEKTOR' in str(col).upper() or 'SECTOR' in str(col).upper() for col in df_unspec.columns)
        has_nd = any(str(col).upper().strip() in ['ND', 'NODE'] for col in df_unspec.columns)
        
        if has_sektor or (has_nd and len(df_unspec.columns) > 15):
            return 'unspec', unspec_header

        # 2. Cari header ukur-massal
        ukur_keywords = ['ND', 'ONU RX POWER', 'RX DBM', 'RX_POWER']
        ukur_header = find_excel_header_row(file_path, ukur_keywords)
        
        if ukur_header > 0 or (ukur_header == 0 and any('RX' in str(col).upper() for col in pd.read_excel(file_path, header=0, nrows=2).columns)):
            return 'ukur', ukur_header
            
        # 3. Cek jika ukur-massal TANPA header
        df_raw = pd.read_excel(file_path, header=None, nrows=3)
        if len(df_raw) > 0 and len(df_raw.columns) > 10:
            val_nd = str(df_raw.iloc[0, 1]).strip()
            val_rx_10 = df_raw.iloc[0, 10]
            val_rx_12 = df_raw.iloc[0, 12]
            
            is_nd = val_nd.split('.')[0].isdigit() and len(val_nd.split('.')[0]) >= 10
            is_rx = (isinstance(val_rx_10, (int, float)) and val_rx_10 < 0) or (isinstance(val_rx_12, (int, float)) and val_rx_12 < 0)
            
            if is_nd and is_rx:
                return 'ukur', None
                
        raise ValueError(
            "Struktur file tidak dikenali. "
            "Pastikan file adalah unspec-semesta (memiliki kolom ND, SEKTOR, dll) atau ukur-massal (iBooster/NMS export)."
        )
    except Exception as e:
        if "Struktur file" in str(e):
            raise e
        raise ValueError(f"Gagal membaca struktur berkas Excel: {str(e)}")

def detect_file_type(file_path: str) -> str:
    """Helper method kompatibilitas"""
    ftype, _ = detect_file_info(file_path)
    return ftype

def parse_ukur_massal_only(file_path: str) -> List[Dict[str, Any]]:
    """Parse file Ukur Massal aja buat update Redaman"""
    try:
        ftype, header_idx = detect_file_info(file_path)
        if ftype != 'ukur':
            raise ValueError("Berkas bukan tipe Ukur Massal")
            
        df_ukur = pd.read_excel(file_path, header=header_idx)
        
        if header_idx is None:
            df_ukur.columns = [f"col_{i}" for i in range(len(df_ukur.columns))]
            nd_column = "col_1"
            rx_column = "col_12" if len(df_ukur.columns) > 12 else "col_10"
        else:
            nd_column = None
            for col in df_ukur.columns:
                col_str = str(col).upper().strip()
                if col_str == 'ND' or 'ND' in col_str or col == df_ukur.columns[1]:
                    nd_column = col
                    break
            if not nd_column and len(df_ukur.columns) > 1:
                nd_column = df_ukur.columns[1]
                
            rx_column = None
            for col in df_ukur.columns:
                col_str = str(col).upper()
                if ('RX' in col_str and 'DBM' in col_str) or 'RX DBM' in col_str:
                    rx_column = col
                    break
            if not rx_column:
                if len(df_ukur.columns) > 12:
                    rx_column = df_ukur.columns[12]
                elif len(df_ukur.columns) > 10:
                    rx_column = df_ukur.columns[10]
            
        if not nd_column or not rx_column:
             raise ValueError("Kolom ND atau Rx Power tidak ditemukan pada berkas Ukur Massal")
             
        data = []
        for _, row in df_ukur.iterrows():
            nd = str(row[nd_column]).strip()
            if '.' in nd:
                nd = nd.split('.')[0]
            rx = row[rx_column]
            if nd and nd != 'nan' and pd.notna(rx):
                data.append({
                    "ND": nd,
                    "UKUR_ULANG": rx 
                })
        return data
        
    except Exception as e:
        raise ValueError(f"Gagal memproses file Ukur Massal: {str(e)}")
        
def parse_and_merge_files(
    file_path_1: str,
    file_path_2: str
) -> List[Dict]:
    """Parse 2 file Excel, gabungin, dan return list of dicts"""
    
    # Step 1: Deteksi tipe file
    type1, header1 = detect_file_info(file_path_1)
    type2, header2 = detect_file_info(file_path_2)
    
    if type1 == type2:
        raise ValueError(
            f"Kedua file memiliki structure yang sama ({type1}). "
            "Upload 1 file unspec-semesta dan 1 file ukur-massal."
        )
    
    unspec_path = file_path_1 if type1 == 'unspec' else file_path_2
    unspec_header = header1 if type1 == 'unspec' else header2
    
    ukur_path = file_path_1 if type1 == 'ukur' else file_path_2
    ukur_header = header1 if type1 == 'ukur' else header2
    
    # Step 2: Parse ukur-massal buat VLOOKUP
    try:
        df_ukur = pd.read_excel(ukur_path, header=ukur_header)
        if ukur_header is None:
            df_ukur.columns = [f"col_{i}" for i in range(len(df_ukur.columns))]
            nd_column = "col_1"
            rx_column = "col_12" if len(df_ukur.columns) > 12 else "col_10"
        else:
            nd_column = None
            for col in df_ukur.columns:
                col_str = str(col).upper().strip()
                if col_str == 'ND' or 'ND' in col_str or col == df_ukur.columns[1]:
                    nd_column = col
                    break
            if not nd_column and len(df_ukur.columns) > 1:
                nd_column = df_ukur.columns[1]
            
            rx_column = None
            for col in df_ukur.columns:
                col_str = str(col).upper()
                if ('RX' in col_str and 'DBM' in col_str) or 'RX DBM' in col_str:
                    rx_column = col
                    break
                    
            if not rx_column:
                if len(df_ukur.columns) > 12:
                    rx_column = df_ukur.columns[12]
                elif len(df_ukur.columns) > 10:
                    rx_column = df_ukur.columns[10]
    except Exception as e:
         raise ValueError(f"Error parse file Ukur Massal: {str(e)}")

    lookup = {}
    if nd_column and rx_column:
        for _, row in df_ukur.iterrows():
            nd = str(row[nd_column]).strip()
            if '.' in nd:
                nd = nd.split('.')[0]
            rx = row[rx_column]
            if nd and nd != 'nan' and pd.notna(rx):
                try:
                    lookup[nd] = float(rx)
                except:
                    pass
    
    # Step 3: Parse unspec-semesta
    try:
        df_unspec = pd.read_excel(unspec_path, header=unspec_header)
    except Exception as e:
        raise ValueError(f"Error parse file Unspec Semesta: {str(e)}")
    
    # Step 4: Map ke output schema
    parsed_data = []
    
    def find_column(df, patterns):
        for col in df.columns:
            col_str = str(col).upper().strip()
            for pattern in patterns:
                if pattern.upper() in col_str:
                    return col
        return None
    
    col_sto = find_column(df_unspec, ['STO', 'KOTA', 'CMDF'])
    col_sektor = find_column(df_unspec, ['SEKTOR', 'SECTOR'])
    
    col_nd = None
    for col in df_unspec.columns:
        if str(col).upper().strip() == 'ND':
            col_nd = col
            break
    if not col_nd:
        col_nd = find_column(df_unspec, ['ND '])
        
    col_odp = find_column(df_unspec, ['ODP', 'DP'])
    col_port = find_column(df_unspec, ['PORT', 'ONU', 'SLOT'])
    col_rx_after = find_column(df_unspec, ['UKUR ULANG', 'REDAMAN', 'RX POWER'])
    col_hvc = find_column(df_unspec, ['HVC', 'FLAG'])
    col_node_id = find_column(df_unspec, ['NODE ID', 'NODE IP', 'NODE_ID'])
    col_length = find_column(df_unspec, ['PANJANG', 'LENGTH', 'TARIKAN'])
    
    for idx, row in df_unspec.iterrows():
        try:
            nd = str(row[col_nd]).strip() if col_nd and pd.notna(row[col_nd]) else ''
            if '.' in nd:
                nd = nd.split('.')[0]
                
            item = {
                "STO": str(row[col_sto]).strip() if col_sto and pd.notna(row[col_sto]) else 'UNMAP',
                "SEKTOR": str(row[col_sektor]).strip() if col_sektor and pd.notna(row[col_sektor]) else 'UNMAP',
                "ND": nd,
                "ODP": str(row[col_odp]).strip() if col_odp and pd.notna(row[col_odp]) else '',
                "PORT": str(row[col_port]).strip() if col_port and pd.notna(row[col_port]) else '',
                "NODE ID": str(row[col_node_id]).strip() if col_node_id and pd.notna(row[col_node_id]) else '',
                "PANJANG TARIKAN": str(row[col_length]).strip() if col_length and pd.notna(row[col_length]) else '',
                "FLAG HVC": str(row[col_hvc]).strip() if col_hvc and pd.notna(row[col_hvc]) else 'Regular',
            }
            
            rx_from_unspec = row[col_rx_after] if col_rx_after and pd.notna(row[col_rx_after]) else None
            rx_from_ukur = lookup.get(nd)
            
            item["ONU RX POWER"] = rx_from_unspec
            item["UKUR ULANG"] = rx_from_ukur
            
            parsed_data.append(item)
            
        except Exception:
            continue
            
    return parsed_data
