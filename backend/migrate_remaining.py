"""
Quick migration untuk daily_reports dan users
"""
import pandas as pd
from sqlalchemy import create_engine

SQLITE_URL = "sqlite:///./gpon_network.db"
POSTGRES_URL = "postgresql://gpon_user:gpon_secure_pass_2026@postgres:5432/gpon_network"

print("Migrating daily_reports dan users...")

sqlite_engine = create_engine(SQLITE_URL)
postgres_engine = create_engine(POSTGRES_URL)

# Daily reports
print("Reading daily_reports from SQLite...")
df_reports = pd.read_sql_table('daily_reports', sqlite_engine)
print(f"Found {len(df_reports)} daily_reports")

if len(df_reports) > 0:
    print("Writing to PostgreSQL...")
    df_reports.to_sql('daily_reports', postgres_engine, if_exists='append', index=False)
    print("✓ daily_reports migrated")

# Users
print("\nReading users from SQLite...")
df_users = pd.read_sql_table('users', sqlite_engine)
print(f"Found {len(df_users)} users")

if len(df_users) > 0:
    print("Writing to PostgreSQL...")
    df_users.to_sql('users', postgres_engine, if_exists='append', index=False)
    print("✓ users migrated")

print("\n✓ DONE!")
