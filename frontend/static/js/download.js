document.addEventListener("DOMContentLoaded", () => {
    const downloadAllBtn = document.getElementById("download-all-btn");

    if (!downloadAllBtn) {
        console.error("Кнопка для скачивания не найдена!");
        return;
    }

    downloadAllBtn.addEventListener("click", async () => {
        console.log("Клик по кнопке 'Скачать все изображения'");
        const pathParts = window.location.pathname.split("/");
        const categoryId = pathParts[pathParts.length - 2]; 
          
        if (!categoryId || isNaN(categoryId)) {
            console.error("ID категории не найден в URL!");
            return;
        }
        const response = await fetch(`/category/${categoryId}/download`, { method: "GET" });
        if (response.ok) {
            console.log("Получен ответ от сервера:", response);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Скачиваем файл
            const a = document.createElement("a");
            a.href = url;
            a.download = `${categoryId}_images.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log("Файл успешно скачан.");
        } else {
            console.error("Ошибка скачивания архива. Статус:", response.status);
        }
    });
});

function deleteImage(event, imageId) {
    event.preventDefault();
    if (confirm("Вы уверены, что хотите удалить это изображение?")) {
        fetch(`/image/${imageId}`, { method: "DELETE" })
            .then((response) => {
                if (response.ok) {
                    const imageElement = document.getElementById(`image-${imageId}`);
                    if (imageElement) imageElement.remove();
                } else {
                    console.error("Ошибка при удалении изображения.");
                }
            })
            .catch((error) => console.error("Ошибка сети:", error));
    }
}

// Функция для открытия модального окна с изображением
function openImageModal(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    modalImage.src = imageSrc;
    modal.classList.remove('hidden');
}

// Функция для закрытия модального окна
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.add('hidden');
}

// Закрытие модального окна при клике вне изображения
document.getElementById('image-modal').addEventListener('click', (event) => {
    if (event.target === document.getElementById('image-modal')) {
        closeImageModal();
    }
});