
export function initializeDownloadsAll() {
    
    const downloadAllCatBtn = document.getElementById("download-all-on-category-btn")

    downloadAllCatBtn.addEventListener("click", async () => {
        console.log("Клик по кнопке 'Скачать все изображения'");
        try {
            console.log("Начало скачивания всех категорий...");
            // Выполняем запрос на скачивание всех категорий
            const response = await fetch('/download-all-categories');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка при скачивании категорий: ${errorText}`);
            }


            // Создаем ссылку для скачивания
            console.log("Ответ получен, создание ссылки для скачивания...");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dataset.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log("Скачивание завершено");
            alert('Все категории успешно скачаны!');
        } catch (error) {
            console.error('Ошибка при скачивании категорий:', error);
            alert('Произошла ошибка при скачивании категорий');
        }
    });
};