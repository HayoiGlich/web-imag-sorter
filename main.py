from typing import List
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.future import select
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from backend.model import Category, Image
from backend.database import engine, get_db_session
from fastapi.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates
import uvicorn
import zipfile
import io
import asyncio
import base64
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from concurrent.futures import ThreadPoolExecutor
import time

# Добавляем фильтр Base64
def to_base64(value: bytes) -> str:
    return base64.b64encode(value).decode("utf-8")

# Lifespan для FastAPI
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        pass
    yield
    await engine.dispose()

# Настройка FastAPI
app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory='frontend')


# Регистрируем фильтр в Jinja2 через templates.env
templates.env.filters["to_base64"] = to_base64

# =====Роуты====
@app.get('/')
async def home(request: Request, db: AsyncSession = Depends(get_db_session)):
    try:
        result = await db.execute(
            select(Category, func.count(Image.id).label("image_count"))
            .outerjoin(Image, Image.category_id == Category.id)
            .group_by(Category.id)
        )
        
        categories_with_counts = [
            {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "image_count": image_count,
            }
            for category, image_count in result.fetchall()
        ]
        
        await db.commit()  # Явный коммит

        return templates.TemplateResponse(
            'index.html',
            {
                "request": request,
                "folders": categories_with_counts,
            }
        )
    except Exception as e:
        print(f"Ошибка при выполнении запроса: {e}")
        await db.rollback()  # Откат в случае ошибки
        raise HTTPException(status_code=500, detail="Ошибка выполнения запроса")
    
# Создание категории
@app.post('/category/')
async def create_category(name: str = Form(...), description: str = Form(""), db: AsyncSession = Depends(get_db_session)):
    # Проверка, что имя категории не пустое
    if not name:
        raise HTTPException(status_code=400, detail="Название категории обязательно")

    new_category = Category(name=name, description=description)
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return {"message": "Категория успешно создана", "category_id": new_category.id}

# Загрузка изображения
@app.post('/upload/')
async def upload_images(
    images: List[UploadFile] = File(...),  # Поддержка нескольких файлов
    category_id: int = Form(...),
    db: AsyncSession = Depends(get_db_session)
):
    # Проверка существования категории
    category = await db.execute(select(Category).where(Category.id == category_id))
    category = category.unique().scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    uploaded_images = []
    
    for image in images:
        # Проверка на существования изображения с таким же именем
        existing_image = await db.execute(select(Image).where(Image.filename == image.filename))
        existing_image = existing_image.unique().scalar_one_or_none()
        
        if existing_image:
            raise HTTPException(status_code=409, detail=f"Изображение с именем '{image.filename}' уже существует")
            

        # Чтение содержимого файла
        image_data = await image.read()

        # Создание новой записи в базе данных
        new_image = Image(filename=image.filename, content=image_data, category_id=category_id)
        db.add(new_image)
        uploaded_images.append(new_image)

    # Сохранение всех изменений
    await db.commit()

    return {
        "message": "Изображения успешно загружены",
        "uploaded_images": [{"id": img.id, "filename": img.filename} for img in uploaded_images]
    }

# Получение изображений из категории
@app.get("/category/{category_id}/images")
async def get_images(category_id: int, request: Request, db: AsyncSession = Depends(get_db_session)):
    try:
        # Запрос к базе данных для получения изображений
        result = await db.execute(
            select(Image).where(Image.category_id == category_id).order_by(Image.filename.asc()))
        images = result.unique().scalars().all()

        category_result = await db.execute(select(Category).where(Category.id == category_id))
        category = category_result.unique().scalar()  # Получаем первый (и единственный) результат

        # if not images:
        #     raise HTTPException(status_code=404, detail="Изображения не найдены для этой категории")
        
        await db.commit()
        # Передаем данные в шаблон
        return templates.TemplateResponse("category_images.html", {
            "request": request,
            "images": images,
            "category_id": category_id,
            "folder_name": category.name
        })
        
    except Exception as e:
        await db.rollback()  # откат в случае ошибки
        print(f"Ошибка выполнения запроса: {e}")

# Скачивание изображения
@app.get("/image/{image_id}/download")
async def download_image(image_id: int, db: AsyncSession = Depends(get_db_session)):
    image = await db.execute(select(Image).where(Image.id == image_id))
    image = image.unique().scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=404, detail="Изображение не найдено")

    return StreamingResponse(
        iter([image.content]),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={image.filename}"},
    )

# Скачивание всех изображений из категории как ZIP
@app.get("/category/{category_id}/download")
async def download_category_images(category_id: int, db: AsyncSession = Depends(get_db_session)):
    # Проверка существования категории
    category_result = await db.execute(select(Category).where(Category.id == category_id))
    category = category_result.scalar()

    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    # Получение изображений для категории
    images_result = await db.execute(select(Image).where(Image.category_id == category_id))
    images = images_result.scalars().all()

    # Создание архива
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for image in images:
            zip_file.writestr(image.filename, image.content)
    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={category.name}_images.zip"
        }
    )

# Удаление изображения
@app.delete("/image/{image_id}")
async def delete_image(image_id: int, db: AsyncSession = Depends(get_db_session)):
    image = await db.execute(select(Image).where(Image.id == image_id))
    image = image.unique().scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=404, detail="Изображение не найдено")

    await db.execute(delete(Image).where(Image.id == image_id))
    await db.commit()
    return {"message": "Изображение успешно удалено"}

# Удаление категории
@app.delete("/category/{category_id}")
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db_session)):
    # Находим категорию
    category = await db.execute(select(Category).where(Category.id == category_id))
    category = category.unique().scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    # Удаляем все изображения, связанные с категорией
    await db.execute(delete(Image).where(Image.category_id == category_id))

    # Удаляем категорию
    await db.execute(delete(Category).where(Category.id == category_id))
    await db.commit()

    return {"message": "Категория успешно удалена"}

@app.get("/download-all-categories")
async def download_all_categories(db: AsyncSession = Depends(get_db_session)):
    try:
        # Используем потоковую передачу файла для снижения нагрузки на память
        zip_file = await generate_zip(db)        
        return StreamingResponse(
            zip_file,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=all_categories.zip"}
        )
    except Exception as e:
        print(f"Ошибка при создании архива: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при создании архива")
    
async def generate_zip(db: AsyncSession):
    # Загружаем все данные одним запросом
    start_time = time.time()
    categories_with_images = await db.execute(
        select(Category, Image)
        .join(Image, Category.id == Image.category_id, isouter=True)
    )
    end_time = time.time()
    print(f"Загрузка всех данных заняла {end_time - start_time:.2f} секунд")

    data = categories_with_images.fetchall()  #Выгрузка всех данных


    grouped_data = {}
    for category, image in data:
        if category not in grouped_data:
            grouped_data[category] = []
        if image:
            grouped_data[category].append(image)

    zip_buffer = io.BytesIO()

    # Создаем ZIP-файл
    start_time = time.time()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_STORED) as zip_file:
        async def process_category(category, images):
            category_folder = f"{category.name}/"
            zip_file.writestr(category_folder, "")
            for image in images:
                zip_file.writestr(f"{category_folder}{image.filename}", image.content)

        # Асинхронно обрабатываем категории
        await asyncio.gather(
            *(process_category(category, images) for category, images in grouped_data.items())
        )
    end_time = time.time()
    print(f"Создание архива заняло: {end_time - start_time} секунд")
    zip_buffer.seek(0)
    return zip_buffer

# Запуск приложения
if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
