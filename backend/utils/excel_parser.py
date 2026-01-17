"""
Excel parser untuk GPON network data
Baca file unspec-semesta.xlsx dan ukur-massal.xlsx
"""
import pandas as pd
from typing import List, Dict, Tuple, Optional
from pathlib import Path


class ExcelParser:
    """Parser untuk file Excel GPON network"""
    
    def __init__(self, unspec_path: str, ukur_massal_path: str):
        self.unspec_path = Path(unspec_path)
        self.ukur_massal_path = Path(ukur_massal_path)
    
    def parse_ukur_massal(self) -> Dict[str, float]:
        """
        Parse ukur-massal.xlsx untuk VLOOKUP
        
        Returns:
            Dictionary dengan ND sebagai key, ONU RX POWER sebagai value
            Ini equivalent dengan Excel VLOOKUP: =VLOOKUP(@K:K;KURMA!B:M;12;0)
        """
        try:
            df = pd.read_excel(self.ukur_massal_path)
            
            # Ambil kolom ND dan ONU RX POWER
            # ND ada di kolom index 1 (kolom B di Excel)
            # ONU RX POWER ada di kolom index 12 (kolom M di Excel)
            lookup_dict = {}
            
            for _, row in df.iterrows():
                nd = row.get('ND')  # Kolom ND
                rx_power = row.get('ONU RX POWER')  # Kolom ONU RX POWER
                
                # Skip kalau ND kosong
                if pd.notna(nd):
                    # Convert ke string untuk key
                    nd_key = str(nd).strip()
                    
                    # Handle berbagai format rx_power
                    if pd.notna(rx_power):
                        try:
                            rx_power_val = float(rx_power)
                            lookup_dict[nd_key] = rx_power_val
                        except (ValueError, TypeError):
                            # Kalau ga bisa convert, skip
                            pass
            
            print(f"✓ Loaded {len(lookup_dict)} entries from ukur-massal.xlsx")
            return lookup_dict
            
        except Exception as e:
            print(f"✗ Error parsing ukur-massal.xlsx: {e}")
            return {}
    
    def parse_unspec_semesta(self, ukur_massal_lookup: Dict[str, float]) -> List[Dict]:
        """
        Parse unspec-semesta.xlsx (main data source)
        
        Args:
            ukur_massal_lookup: Dictionary hasil dari parse_ukur_massal()
        
        Returns:
            List of dictionaries dengan data network nodes
        """
        try:
            df = pd.read_excel(self.unspec_path)
            
            print(f"✓ Loaded {len(df)} rows from unspec-semesta.xlsx")
            
            nodes = []
            for idx, row in df.iterrows():
                # Extract semua kolom yang dibutuhkan
                nd = str(row.get('ND', '')).strip()
                
                # Lookup rx_power_before dari ukur_massal
                rx_power_before = ukur_massal_lookup.get(nd)
                
                # rx_power_after dari kolom ONU RX POWER UKUR ULANG
                rx_power_after_raw = row.get('ONU RX POWER UKUR ULANG')
                rx_power_after = None
                if pd.notna(rx_power_after_raw):
                    try:
                        rx_power_after = float(rx_power_after_raw)
                    except (ValueError, TypeError):
                        pass
                
                # Extract kolom lainnya
                node_data = {
                    'row_number': int(row.get('No', idx + 1)),
                    'sto': str(row.get('CMDF', '')).strip(),
                    'sector': str(row.get('SEKTOR', '')).strip(),
                    'nd': nd,
                    'odp': str(row.get('ODP', '')).strip(),
                    'port': str(row.get('SHELF|SLOT|PORT| ONU ID', '')).strip(),
                    'node_id': str(row.get('NODE ID(NODE IP)', '')).strip(),
                    'fiber_length': row.get('FIBER LENGTH'),
                    'rk': str(row.get('RK', '')).strip(),
                    'tanggal_ps': row.get('TANGGAL PS'),
                    'status_inet': str(row.get('STATUS INET', '')).strip(),
                    'rx_power_before': rx_power_before,  # Dari ukur_massal VLOOKUP
                    'rx_power_after': rx_power_after,    # ONU RX POWER UKUR ULANG
                    'tanggal_ukur': row.get('TANGGAL UKUR'),
                    'tanggal_ukur_ulang': row.get('TANGGAL UKUR ULANG'),
                    'nomor_tiket': str(row.get('NOMOR TIKET', '')).strip(),
                    'status_tiket': str(row.get('STATUS TIKET', '')).strip(),
                    'hvc_category': str(row.get('FLAG HVC', 'Regular')).strip(),
                    'type_pelanggan': str(row.get('TYPE PELANGGAN', '')).strip(),
                    'prioritas': str(row.get('PRIORITAS', '')).strip(),
                }
                
                nodes.append(node_data)
            
            print(f"✓ Parsed {len(nodes)} network nodes")
            return nodes
            
        except Exception as e:
            print(f"✗ Error parsing unspec-semesta.xlsx: {e}")
            raise
    
    def load_all_data(self) -> Tuple[List[Dict], Dict[str, float]]:
        """
        Load dan merge semua data dari kedua file Excel
        
        Returns:
            Tuple of (nodes_list, ukur_massal_lookup)
        """
        print("\n" + "=" * 80)
        print("LOADING EXCEL DATA")
        print("=" * 80)
        
        # Step 1: Parse ukur-massal untuk VLOOKUP
        print("\n[1/2] Parsing ukur-massal.xlsx...")
        ukur_massal_lookup = self.parse_ukur_massal()
        
        # Step 2: Parse unspec-semesta dan merge
        print("\n[2/2] Parsing unspec-semesta.xlsx...")
        nodes = self.parse_unspec_semesta(ukur_massal_lookup)
        
        print("\n" + "=" * 80)
        print(f"✓ DATA LOADING COMPLETE")
        print(f"  Total Nodes: {len(nodes)}")
        print(f"  VLOOKUP Matches: {sum(1 for n in nodes if n['rx_power_before'] is not None)}")
        print("=" * 80 + "\n")
        
        return nodes, ukur_massal_lookup


if __name__ == "__main__":
    # Test parser
    import os
    
    # Determine paths relative to current file location
    current_dir = Path(__file__).parent.parent.parent  # Go up to project root
    unspec_path = current_dir / "unspec-semesta.xlsx"
    ukur_path = current_dir / "ukur-massal.xlsx"
    
    print(f"Looking for files:")
    print(f"  unspec: {unspec_path}")
    print(f"  ukur:   {ukur_path}")
    print(f"  unspec exists: {unspec_path.exists()}")
    print(f"  ukur exists:   {ukur_path.exists()}\n")
    
    parser = ExcelParser(
        unspec_path=str(unspec_path),
        ukur_massal_path=str(ukur_path)
    )
    
    nodes, lookup = parser.load_all_data()
    
    # Print sample
    if nodes:
        print("\nSample node (first record):")
        sample = nodes[0]
        for key, value in sample.items():
            print(f"  {key:20s}: {value}")
