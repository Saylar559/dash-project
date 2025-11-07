from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    config = Column(Text, nullable=False)  # JSON как текст
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    is_published = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="dashboards")
    
    def __repr__(self):
        return f"<Dashboard(id={self.id}, title='{self.title}', owner_id={self.owner_id})>"
