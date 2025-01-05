import asyncio
from sqlalchemy.ext.asyncio import create_async_engine,AsyncAttrs,async_sessionmaker,AsyncSession
from sqlalchemy.orm import Session,sessionmaker, DeclarativeBase
from sqlalchemy import URL,text
from backend.config import settings
from sqlalchemy import Integer, func
from sqlalchemy.orm import DeclarativeBase, declared_attr, Mapped, mapped_column
from datetime import datetime


engine = create_async_engine(settings.DATABASE_URL_asyncpg, echo=True)

async_session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

async def get_db_session():
    async with async_session_maker() as session:
        yield session

class Base(AsyncAttrs,DeclarativeBase):
    __abstract__ = True  

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())