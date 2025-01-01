from datetime import datetime
from typing import Annotated
from sqlalchemy import Column, DateTime, text,ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base
from sqlalchemy.sql import func

class Category(Base):
    __tablename__ = 'categories'

    id : Mapped[int] = mapped_column(Integer,primary_key=True,autoincrement=True)
    name : Mapped[str] = mapped_column(String(50), unique= True, nullable= False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    images: Mapped[list["Image"]] = relationship("Image", back_populates="category")

class Image(Base):
    __tablename__ = 'images'

    id : Mapped[int] = mapped_column(Integer,primary_key=True,autoincrement=True)
    filename : Mapped[str] = mapped_column(String(255), unique= True, nullable= False)
    content : Mapped[bytes] = mapped_column(LargeBinary)
    upload_date: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,  # Значение по умолчанию для Python
        server_default=func.now(),  # Значение по умолчанию на уровне базы данных
        onupdate=func.now()  # Обновление при изменении строки
    )
    category_id : Mapped[int] = mapped_column(ForeignKey('categories.id', ondelete= 'CASCADE'))
    
    category : Mapped["Category"] = relationship("Category", back_populates="images", order_by="Image.id.desc()")
