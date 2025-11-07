from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DEVELOPER = "DEVELOPER"
    ACCOUNTANT = "ACCOUNTANT"
    USER = "USER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    # last_login присутствует в таблице — если нужен:
    # last_login = Column(DateTime(timezone=True), nullable=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    def is_admin(self):
        return self.role == UserRole.ADMIN

    def is_developer(self):
        return self.role == UserRole.DEVELOPER

    def is_accountant(self):
        return self.role == UserRole.ACCOUNTANT

    def is_user(self):
        return self.role == UserRole.USER
