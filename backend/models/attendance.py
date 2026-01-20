from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class AttendanceDB(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    clock_in_time = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float)
    longitude = Column(Float)
    photo_file_id = Column(String) # Telegram File ID
    keterangan = Column(String, nullable=True) # Late reason etc.

    user = relationship("UserDB", back_populates="attendances")
