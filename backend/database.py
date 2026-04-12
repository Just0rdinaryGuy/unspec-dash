"""
Konfigurasi Database buat GPON Network Dashboard
PostgreSQL buat production (migrasi dari SQLite)
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, BigInteger, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import os

# Database URL - PostgreSQL (production)
# Fallback ke SQLite kalo DATABASE_URL ga ada di environment
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://gpon_user:gpon_secure_pass_2026@localhost:5432/gpon_network"
)

# Bikin engine
# Note: SQLite pake check_same_thread, PostgreSQL ga butuh
engine = create_engine(DATABASE_URL)

# Session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class buat models
Base = declarative_base()

def wita_now():
    """Return waktu sekarang dalam WITA (UTC+8)"""
    return datetime.utcnow() + timedelta(hours=8)

# Database Models
class NetworkNodeDB(Base):
    """Tabel network node - simpen data jaringan GPON"""
    __tablename__ = "network_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    row_number = Column(Integer)
    
    # Identifier jaringan
    sto = Column(String, index=True)
    sector = Column(String, index=True)
    nd = Column(String, index=True)
    odp = Column(String)
    port = Column(String)
    node_id = Column(String)
    
    # Spesifikasi jaringan
    fiber_length = Column(String, nullable=True)  # Diubah jadi String
    
    # Measurement RX Power
    rx_power_before = Column(Float, nullable=True)
    rx_power_after = Column(Float, nullable=True)
    
    # Status
    spec_status = Column(String, index=True)
    ticket_status = Column(String, default="OPEN", index=True)
    
    # Field Ticket yang bisa diedit
    nama_teknisi = Column(String, default="System")
    status_rfo = Column(String, default="OPEN")
    no_tiket = Column(String, nullable=True)
    
    # Tanggal
    tanggal_ukur_ulang = Column(DateTime, nullable=True)
    import_date = Column(DateTime, nullable=True, index=True)
    
    # Info customer
    hvc_category = Column(String, index=True)
    
    # Timestamp
    created_at = Column(DateTime, default=wita_now)


class UserDB(Base):
    """Tabel user buat autentikasi"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    nik = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="user")  # 'admin', 'developer', 'user', 'teknisi'
    is_active = Column(Boolean, default=True)
    chat_id = Column(BigInteger, unique=True, nullable=True)
    telegram_username = Column(String, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team = relationship("TeamDB", back_populates="members", foreign_keys=[team_id])
    attendances = relationship("AttendanceDB", back_populates="user")
    created_at = Column(DateTime, default=wita_now)
    updated_at = Column(DateTime, default=wita_now, onupdate=wita_now)


def init_db():
    """Initialize database - bikin semua tabel"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")


def get_db():
    """Dependency untuk FastAPI - get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def drop_all_tables():
    """Drop all tables - untuk reset database"""
    print("⚠  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables dropped")


if __name__ == "__main__":
    # Test database creation
    print("=" * 60)
    print("DATABASE SETUP TEST")
    print("=" * 60)
    print(f"\nDatabase URL: {DATABASE_URL}\n")
    
    # Drop existing tables
    drop_all_tables()
    
    # Create tables
    init_db()
    
    # Test insert
    db = SessionLocal()
    try:
        test_node = NetworkNodeDB(
            row_number=1,
            sto="BAM",
            sector="UNMAP",
            nd="BSA12345",
            odp="ODP-BSA-001",
            port="1/1/1/1",
            rx_power_after=-20.5,
            spec_status="SPEC",
            ticket_status="CLOSED",
            hvc_category="Regular"
        )
        db.add(test_node)
        db.commit()
        
        # Query back
        count = db.query(NetworkNodeDB).count()
        print(f"\n✓ Test insert successful - Total nodes: {count}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("DATABASE READY")
    print("=" * 60)
