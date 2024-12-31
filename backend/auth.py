from fastapi import APIRouter, HTTPException, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from backend.model import User
from backend.database import get_db_session

# Настройка шифрования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Создание маршрутизатора
router = APIRouter()

@router.post("/auth/login")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Маршрут для авторизации пользователей.
    Проверяет, существует ли пользователь с указанным email и совпадает ли пароль.
    """
    # Поиск пользователя по email
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar()

    # Проверка существования пользователя и пароля
    if not user or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    return {"username": user.username, "email": user.email, "message": "Авторизация успешна"}
