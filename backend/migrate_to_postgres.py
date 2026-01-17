"""
Script Migrasi Data: SQLite → PostgreSQL (Pandas Approach)
Migrate semua data pakai pandas biar robust
"""
import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

# SQLite source
SQLITE_URL = "sqlite:///./gpon_network.db"

# PostgreSQL target
POSTGRES_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://gpon_user:gpon_secure_pass_2026@postgres:5432/gpon_network"
)

print("=" * 60)
print("MIGRASI DATA: SQLite → PostgreSQL (Pandas)")
print("=" * 60)
print(f"Source: SQLite")
print(f"Target: PostgreSQL")
print("=" * 60)

# Connect
print("\n[1/5] Connecting...")
try:
    sqlite_engine = create_engine(SQLITE_URL)
    postgres_engine = create_engine(POSTGRES_URL)
    print("✓ Connected to both databases")
except Exception as e:
    print(f"✗ Connection error: {e}")
    sys.exit(1)

# Create tables
print("\n[2/5] Creating tables...")
try:
    from database import Base
    Base.metadata.create_all(bind=postgres_engine)
    print("✓ Tables created")
except Exception as e:
    print(f"✗ Error creating tables: {e}")
    sys.exit(1)

# Read from SQLite
print("\n[3/5] Reading data dari SQLite...")
try:
    df_network = pd.read_sql_table('network_nodes', sqlite_engine)
    df_reports = pd.read_sql_table('daily_reports', sqlite_engine)
    df_users = pd.read_sql_table('users', sqlite_engine)
    
    print(f"  • network_nodes: {len(df_network)} rows")
    print(f"  • daily_reports: {len(df_reports)} rows")
    print(f"  • users: {len(df_users)} rows")
except Exception as e:
    print(f"✗ Error reading SQLite: {e}")
    sys.exit(1)

# Write to PostgreSQL
print("\n[4/5] Writing data ke PostgreSQL...")
try:
    # Network nodes
    if len(df_network) > 0:
        print(f"  Writing {len(df_network)} network_nodes...")
        df_network.to_sql('network_nodes', postgres_engine, if_exists='append', index=False)
        print("  ✓ network_nodes written")
    
    # Daily reports
    if len(df_reports) > 0:
        print(f"  Writing {len(df_reports)} daily_reports...")
        df_reports.to_sql('daily_reports', postgres_engine, if_exists='append', index=False)
        print("  ✓ daily_reports written")
    
    # Users
    if len(df_users) > 0:
        print(f"  Writing {len(df_users)} users...")
        df_users.to_sql('users', postgres_engine, if_exists='append', index=False)
        print("  ✓ users written")
        
except Exception as e:
    print(f"✗ Error writing to PostgreSQL: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Verify
print("\n[5/5] Verifying...")
try:
    with postgres_engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM network_nodes"))
        pg_network = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM daily_reports"))
        pg_reports = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        pg_users = result.scalar()
    
    print(f"\nVerification:")
    print(f"  network_nodes: SQLite={len(df_network)}, PostgreSQL={pg_network} {'✓' if len(df_network) == pg_network else '✗'}")
    print(f"  daily_reports: SQLite={len(df_reports)}, PostgreSQL={pg_reports} {'✓' if len(df_reports) == pg_reports else '✗'}")
    print(f"  users: SQLite={len(df_users)}, PostgreSQL={pg_users} {'✓' if len(df_users) == pg_users else '✗'}")
    
    if (len(df_network) == pg_network and 
        len(df_reports) == pg_reports and 
        len(df_users) == pg_users):
        print("\n" + "=" * 60)
        print("✓ MIGRASI SUKSES!")
        print("=" * 60)
        print("\n✨ Data sudah dimigrate ke PostgreSQL!")
        print("SQLite file (gpon_network.db) masih ada sebagai backup.")
        print("\nAplikasi sekarang menggunakan PostgreSQL! 🚀")
    else:
        print("\n✗ VERIFICATION GAGAL!")
        sys.exit(1)
        
except Exception as e:
    print(f"✗ Verification error: {e}")
    sys.exit(1)
