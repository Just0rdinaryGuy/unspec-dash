"""
Simplified data import - direct approach tanpa complex module imports
"""
import sys
from pathlib import Path

# Setup paths
backend_dir = Path(__file__).parent.parent
project_root = backend_dir.parent
sys.path.insert(0, str(backend_dir))

import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Constants
SPEC_MIN = -24.89
SPEC_MAX = -13.5
ERROR_CODES = [-500, -501, -502, -503, -504]

# Database setup
DATABASE_URL = "sqlite:///" + str(backend_dir / "gpon_network.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Model
class NetworkNodeDB(Base):
    __tablename__ = "network_nodes"
    
    id = Column(Integer, primary_key=True)
    row_number = Column(Integer)
    sto = Column(String, index=True)
    sector = Column(String, index=True)
    nd = Column(String, index=True)
    odp = Column(String)
    port = Column(String)
    node_id = Column(String)
    fiber_length = Column(String, nullable=True)  # Changed to String - Excel has mixed types
    rx_power_before = Column(Float, nullable=True)
    rx_power_after = Column(Float, nullable=True)
    spec_status = Column(String, index=True)
    ticket_status = Column(String)
    hvc_category = Column(String, index=True)
    tanggal_ukur_ulang = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def determine_spec_status(rx_power):
    """Determine SPEC/UNSPEC"""
    if rx_power is None or rx_power in ERROR_CODES:
        return "UNSPEC"
    if rx_power > SPEC_MAX or rx_power < SPEC_MIN:
        return "UNSPEC"
    return "SPEC"

print("=" * 80)
print("GPON NETWORK DATA IMPORT")
print("=" * 80)

# Paths
unspec_path = project_root / "unspec-semesta.xlsx"
ukur_path = project_root / "ukur-massal.xlsx"

print(f"\nFiles:")
print(f"  unspec: {unspec_path} (exists: {unspec_path.exists()})")
print(f"  ukur:   {ukur_path} (exists: {ukur_path.exists()})")

# Step 1: Parse ukur-massal
print("\n[1/4] Parsing ukur-massal.xlsx...")
df_ukur = pd.read_excel(ukur_path)
lookup = {}
for _, row in df_ukur.iterrows():
    nd = str(row.get('ND', '')).strip()
    rx = row.get('ONU RX POWER')
    if nd and pd.notna(rx):
        try:
            lookup[nd] = float(rx)
        except:
            pass
print(f"  ✓ Loaded {len(lookup)} VLOOKUP entries")

# Step 2: Parse unspec-semesta
print("\n[2/4] Parsing unspec-semesta.xlsx...")
df_unspec = pd.read_excel(unspec_path)
print(f"  ✓ Loaded {len(df_unspec)} nodes")

# Step 3: Create database
print("\n[3/4] Setting up database...")
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
print("  ✓ Database ready")

# Step 4: Import data
print("\n[4/4] Importing data...")
db = SessionLocal()
imported = 0

for _, row in df_unspec.iterrows():
    try:
        nd = str(row.get('ND', '')).strip()
        rx_after_raw = row.get('ONU RX POWER UKUR ULANG')
        
        # Convert RX power
        rx_after = None
        if pd.notna(rx_after_raw):
            try:
                rx_after = float(rx_after_raw)
            except:
                pass
        
        # VLOOKUP rx_before
        rx_before = lookup.get(nd)
        
        # Calculate status
        spec_status = determine_spec_status(rx_after)
        ticket_status = "CLOSED" if spec_status == "SPEC" else "SISA TIKET"
        
        # Parse date
        tanggal = row.get('TANGGAL UKUR ULANG')
        if pd.notna(tanggal):
            try:
                tanggal = pd.to_datetime(tanggal)
            except:
                tanggal = None
        else:
            tanggal = None
        
        # Create record
        node = NetworkNodeDB(
            row_number=int(row.get('No', 0)),
            sto=str(row.get('CMDF', '')).strip(),
            sector=str(row.get('SEKTOR', '')).strip(),
            nd=nd,
            odp=str(row.get('ODP', '')).strip(),
            port=str(row.get('SHELF|SLOT|PORT| ONU ID', '')).strip(),
            node_id=str(row.get('NODE ID(NODE IP)', '')).strip(),
            fiber_length=str(row.get('FIBER LENGTH', '')).strip() if pd.notna(row.get('FIBER LENGTH')) else None,
            rx_power_before=rx_before,
            rx_power_after=rx_after,
            spec_status=spec_status,
            ticket_status=ticket_status,
            hvc_category=str(row.get('FLAG HVC', 'Regular')).strip(),
            tanggal_ukur_ulang=tanggal,
        )
        
        db.add(node)
        imported += 1
        
        if imported % 50 == 0:
            db.commit()
            print(f"  ... {imported} nodes imported")
    
    except Exception as e:
        print(f"  ✗ Error row {row.get('No', '?')}: {e}")
        continue

db.commit()
db.close()

# Verify
db = SessionLocal()
total = db.query(NetworkNodeDB).count()
spec_count = db.query(NetworkNodeDB).filter(NetworkNodeDB.spec_status == "SPEC").count()
unspec_count = total - spec_count
stos = db.query(NetworkNodeDB.sto).distinct().count()
db.close()

print("\n" + "=" * 80)
print("IMPORT SUMMARY")
print("=" * 80)
print(f"  Total Imported:  {total}")
print(f"  SPEC:            {spec_count} ({spec_count/total*100:.1f}%)")
print(f"  UNSPEC:          {unspec_count} ({unspec_count/total*100:.1f}%)")
print(f"  Unique STOs:     {stos}")
print(f"  Database:        {backend_dir / 'gpon_network.db'}")
print("=" * 80)
print("\n✓ Import successful!")
