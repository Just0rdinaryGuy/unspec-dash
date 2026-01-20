from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base, wita_now

class TeamDB(Base):
    """Tabel Tim / Sektor"""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Nama Tim / Sektor
    sto = Column(String, index=True)
    
    # Leader / Koordinator (User ID)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=wita_now)

    # Relationships
    # Relationships
    leader = relationship("UserDB", foreign_keys=[leader_id])
    members = relationship("UserDB", back_populates="team", foreign_keys="UserDB.team_id")
