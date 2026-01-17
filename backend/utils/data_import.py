"""
Data import script - Import Excel data ke database
Run ini sekali untuk populate database dengan real data
"""
import sys
from pathlib import Path

# Add parent directory to path untuk import modules
sys.path.append(str(Path(__file__).parent.parent))

from utils.excel_parser import ExcelParser
from utils.status_logic import determine_spec_status, determine_ticket_status
from database import init_db, drop_all_tables, SessionLocal, NetworkNodeDB
from datetime import datetime
import pandas as pd


def parse_date(date_val):
    """Parse Excel date value ke Python datetime"""
    if pd.isna(date_val):
        return None
    
    if isinstance(date_val, datetime):
        return date_val
    
    try:
        return pd.to_datetime(date_val)
    except:
        return None


def import_data_from_excel():
    """Main import function"""
    
    print("\n" + "=" * 80)
    print("GPON NETWORK DATA IMPORT")
    print("=" * 80)
    
    # Step 1: Parse Excel files
    project_root = Path(__file__).parent.parent.parent
    unspec_path = project_root / "unspec-semesta.xlsx"
    ukur_path = project_root / "ukur-massal.xlsx"
    
    print(f"\n[Step 1/4] Parsing Excel files...")
    print(f"  unspec-semesta: {unspec_path}")
    print(f"  ukur-massal:    {ukur_path}")
    
    parser = ExcelParser(
        unspec_path=str(unspec_path),
        ukur_massal_path=str(ukur_path)
    )
    
    nodes_data, lookup_data = parser.load_all_data()
    
    if not nodes_data:
        print("✗ No data loaded from Excel!")
        return False
    
    # Step 2: Initialize database
    print(f"\n[Step 2/4] Setting up database...")
    
    # Drop existing tables dan create baru
    drop_all_tables()
    init_db()
    
    # Step 3: Process dan import data
    print(f"\n[Step 3/4] Processing and importing data...")
    
    db = SessionLocal()
    imported_count = 0
    error_count = 0
    
    for node_data in nodes_data:
        try:
            # Calculate SPEC status dari rx_power_after
            rx_power = node_data.get('rx_power_after')
            spec_status = determine_spec_status(rx_power)
            ticket_status = determine_ticket_status(spec_status)
            
            # Create database record
            db_node = NetworkNodeDB(
                row_number=node_data.get('row_number'),
                sto=node_data.get('sto'),
                sector=node_data.get('sector'),
                nd=node_data.get('nd'),
                odp=node_data.get('odp'),
                port=node_data.get('port'),
                node_id=node_data.get('node_id'),
                fiber_length=node_data.get('fiber_length'),
                rk=node_data.get('rk'),
                rx_power_before=node_data.get('rx_power_before'),
                rx_power_after=node_data.get('rx_power_after'),
                spec_status=spec_status,  # Calculated
                ticket_status=ticket_status,  # Calculated
                tanggal_ps=parse_date(node_data.get('tanggal_ps')),
                tanggal_ukur=parse_date(node_data.get('tanggal_ukur')),
                tanggal_ukur_ulang=parse_date(node_data.get('tanggal_ukur_ulang')),
                hvc_category=node_data.get('hvc_category'),
                type_pelanggan=node_data.get('type_pelanggan'),
                status_inet=node_data.get('status_inet'),
                nomor_tiket=node_data.get('nomor_tiket'),
                status_tiket=node_data.get('status_tiket'),
                prioritas=node_data.get('prioritas'),
            )
            
            db.add(db_node)
            imported_count += 1
            
            # Commit every 50 records untuk performance
            if imported_count % 50 == 0:
                db.commit()
                print(f"  ... {imported_count} nodes imported")
        
        except Exception as e:
            error_count += 1
            print(f"  ✗ Error importing node {node_data.get('nd', 'unknown')}: {e}")
            continue
    
    # Final commit
    try:
        db.commit()
        print(f"\n✓ Import complete!")
    except Exception as e:
        print(f"✗ Error during final commit: {e}")
        db.rollback()
    finally:
        db.close()
    
    # Step 4: Verify import
    print(f"\n[Step 4/4] Verifying data...")
    
    db = SessionLocal()
    try:
        total_count = db.query(NetworkNodeDB).count()
        spec_count = db.query(NetworkNodeDB).filter(NetworkNodeDB.spec_status == "SPEC").count()
        unspec_count = db.query(NetworkNodeDB).filter(NetworkNodeDB.spec_status == "UNSPEC").count()
        
        # Get unique STOs
        stos = db.query(NetworkNodeDB.sto).distinct().count()
        
        # Get HVC distribution
        hvc_counts = {}
        for node in db.query(NetworkNodeDB.hvc_category, NetworkNodeDB.id).all():
            hvc = node.hvc_category or "Regular"
            hvc_counts[hvc] = hvc_counts.get(hvc, 0) + 1
        
        print("\n" + "=" * 80)
        print("IMPORT SUMMARY")
        print("=" * 80)
        print(f"  Total Nodes in DB:     {total_count}")
        print(f"  Successfully Imported: {imported_count}")
        print(f"  Errors:                {error_count}")
        print(f"\n  SPEC Status:")
        print(f"    SPEC:   {spec_count} ({spec_count/total_count*100:.1f}%)")
        print(f"    UNSPEC: {unspec_count} ({unspec_count/total_count*100:.1f}%)")
        print(f"\n  Network:")
        print(f"    Unique STOs: {stos}")
        print(f"\n  HVC Distribution:")
        for hvc, count in sorted(hvc_counts.items()):
            print(f"    {hvc:15s}: {count}")
        print("=" * 80)
        
        return total_count == len(nodes_data)
        
    finally:
        db.close()


if __name__ == "__main__":
    success = import_data_from_excel()
    
    if success:
        print("\n✓ Data import successful!")
        sys.exit(0)
    else:
        print("\n✗ Data import failed!")
        sys.exit(1)
