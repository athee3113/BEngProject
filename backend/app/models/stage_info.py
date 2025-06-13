from sqlalchemy import Column, Integer, String, Text, DateTime, text
from app.core.database import Base

class StageInfo(Base):
    __tablename__ = "stage_info"

    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'buyer' or 'seller'
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    # Create a unique constraint on stage and role combination
    __table_args__ = (
        {'sqlite_autoincrement': True},
    ) 