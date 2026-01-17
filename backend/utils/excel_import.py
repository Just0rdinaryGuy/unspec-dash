"""
Refactored data import - fungsi reusable buat processing Excel
Validasi based on struktur Excel, bukan nama file
"""
import pandas as pd
from datetime import datetime
from typing import Dict, Tuple, List, Any


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

def detect_file_type(file_path: str) -> str:
    """
    Deteksi tipe file based on struktur kolom
    Kedua file punya multi-row headers:
    - UKUR-MASSAL: header di row 2 (index 2)
    - UNSPEC-SEMESTA: header di row 4 (index 4)
    
    Returns: 'unspec' atau 'ukur'
    Raises: ValueError kalo ga cocok kedua struktur
    """
    try:
        # Coba UNSPEC-SEMESTA dulu (header di row 4 - skip 4 rows pertama)
        df_unspec = pd.read_excel(file_path, header=4, nrows=0)
        columns_unspec = set(df_unspec.columns)
        
        # Cek UNSPEC-SEMESTA dengan nyari kolom kunci
        # File user punya nama kolom beda, jadi cek pattern
        has_no = any('NO' in str(col).upper() for col in df_unspec.columns)
        has_sto = any('STO' in str(col).upper() or 'KOTA' in str(col).upper() for col in df_unspec.columns)
        has_nd = any(str(col).upper().strip() in ['ND', 'NODE'] or 'NODE' in str(col).upper() for col in df_unspec.columns)
        
        # Kalo nemu kolom-kolom typical UNSPEC, berarti kemungkinan UNSPEC
        if has_no and (has_sto or has_nd):
            return 'unspec'
        
        # Coba UKUR-MASSAL (header di row 2)
        df_ukur = pd.read_excel(file_path, header=2, nrows=0)
        
        # Cari kolom "Rx dBm" atau kolom RX power sejenis
        has_rx = False
        for col in df_ukur.columns:
            col_str = str(col).upper()
            if ('RX' in col_str and 'DBM' in col_str) or 'RX DBM' in col_str:
                has_rx = True
                break
        
        if has_rx:
            return 'ukur'
        
        raise ValueError(
            f"File structure tidak dikenali. "
            f"Pastikan file adalah unspec-semesta (header row 5) atau ukur-massal (header row 3)"
        )
    
    except Exception as e:
        raise ValueError(f"Error baca file Excel: {str(e)}")

def parse_ukur_massal_only(file_path: str) -> List[Dict[str, Any]]:
    """Parse file Ukur Massal aja buat update Redaman"""
    try:
        df_ukur = pd.read_excel(file_path, header=2)
        
        data = []
        
        # Cari kolom ND
        nd_column = None
        for col in df_ukur.columns:
            col_str = str(col).upper().strip()
            if col_str == 'ND' or 'ND' in col_str or col == df_ukur.columns[1]:
                nd_column = col
                break
        if not nd_column and len(df_ukur.columns) > 1:
            nd_column = df_ukur.columns[1]
            
        # Cari kolom Rx dBm
        rx_column = None
        for col in df_ukur.columns:
            col_str = str(col).upper()
            if ('RX' in col_str and 'DBM' in col_str) or 'RX DBM' in col_str:
                rx_column = col
                break
        if not rx_column and len(df_ukur.columns) > 21:
             # Fallback by posisi kalo typical index -21 valid
            sample_val = df_ukur.iloc[0, 21] if len(df_ukur) > 0 else None
            if pd.notna(sample_val) and isinstance(sample_val, (int, float)):
                 rx_column = df_ukur.columns[21]
            
        if not nd_column or not rx_column:
             raise ValueError("Kolom ND atau Rx dBm ga ketemu di Ukur Massal")
             
        for _, row in df_ukur.iterrows():
            nd = str(row[nd_column]).strip()
            rx = row[rx_column]
            if nd and pd.notna(rx):
                data.append({
                    "ND": nd,
                    "UKUR_ULANG": rx 
                })
        return data
        
    except Exception as e:
        raise ValueError(f"Error parse file Ukur Massal: {str(e)}")
        
def parse_and_merge_files(
    file_path_1: str,
    file_path_2: str
) -> List[Dict]:
    """
    Parse 2 file Excel, gabungin, dan return list of dicts
    TIDAK berinteraksi sama Database.
    """
    
    # Step 1: Deteksi tipe file
    type1 = detect_file_type(file_path_1)
    type2 = detect_file_type(file_path_2)
    
    # Validasi kedua file berbeda
    if type1 == type2:
        raise ValueError(
            f"Kedua file memiliki structure yang sama ({type1}). "
            "Upload 1 file unspec-semesta dan 1 file ukur-massal."
        )
    
    # Assign path
    unspec_path = file_path_1 if type1 == 'unspec' else file_path_2
    ukur_path = file_path_1 if type1 == 'ukur' else file_path_2
    
    # Step 2: Parse ukur-massal buat VLOOKUP
    try:
        df_ukur = pd.read_excel(ukur_path, header=2)
    except Exception as e:
         raise ValueError(f"Error parse file Ukur Massal: {str(e)}")

    lookup = {}
    
    # Cari kolom ND (harusnya kolom B, index 1)
    nd_column = None
    for col in df_ukur.columns:
        col_str = str(col).upper().strip()
        if col_str == 'ND' or 'ND' in col_str or col == df_ukur.columns[1]:
            nd_column = col
            break
    if not nd_column and len(df_ukur.columns) > 1:
        nd_column = df_ukur.columns[1]
    
    # Cari kolom Rx dBm (harusnya kolom V, sekitar index 21)
    rx_column = None
    for col in df_ukur.columns:
        col_str = str(col).upper()
        if ('RX' in col_str and 'DBM' in col_str) or 'RX DBM' in col_str:
            rx_column = col
            break
            
    # Fallback by posisi
    if not rx_column and len(df_ukur.columns) > 21:
        sample_val = df_ukur.iloc[0, 21] if len(df_ukur) > 0 else None
        if pd.notna(sample_val) and isinstance(sample_val, (int, float)):
             rx_column = df_ukur.columns[21]
    
    if nd_column and rx_column:
        for _, row in df_ukur.iterrows():
            nd = str(row[nd_column]).strip()
            rx = row[rx_column]
            if nd and pd.notna(rx):
                try:
                    lookup[nd] = float(rx)
                except:
                    pass
    
    # Step 3: Parse unspec-semesta
    try:
        df_unspec = pd.read_excel(unspec_path, header=4)
    except Exception as e:
        raise ValueError(f"Error parse file Unspec Semesta: {str(e)}")
    
    # Step 4: Map ke output schema
    parsed_data = []
    
    # Cari kolom by pattern matching
    def find_column(df, patterns):
        for col in df.columns:
            col_str = str(col).upper().strip()
            for pattern in patterns:
                if pattern.upper() in col_str:
                    return col
        return None
    
    col_sto = find_column(df_unspec, ['STO', 'KOTA', 'CMDF'])
    col_sektor = find_column(df_unspec, ['SEKTOR', 'SECTOR'])
    
    # ND harus strict
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
            
            # Skip kalo ND kosong? Mungkin engga, simpen semua buat audit
            # RealDataService nanti kasih default
            
            # Get values
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
            
            # Mapping Power
            # rx_from_unspec: Value di file Unspec (Base Value) -> ONU RX POWER
            rx_from_unspec = row[col_rx_after] if col_rx_after and pd.notna(row[col_rx_after]) else None
            
            # rx_from_ukur: Value dari Ukur Massal (New Value) -> UKUR ULANG
            rx_from_ukur = lookup.get(nd)
            
            # FIX YANG KETUKER:
            # Ukur Massal nyediain value BARU (UKUR ULANG)
            # File Unspec nyediain value LAMA/Base (ONU RX POWER)
            item["ONU RX POWER"] = rx_from_unspec   # Dulu rx_before (lookup) -> SALAH
            item["UKUR ULANG"] = rx_from_ukur       # Dulu rx_after (row) -> SALAH
            
            parsed_data.append(item)
            
        except Exception:
            continue
            
    return parsed_data
