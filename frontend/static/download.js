document.addEventListener("DOMContentLoaded", () => {
    const downloadAllBtn = document.getElementById("download-all-btn");

    if (!downloadAllBtn) {
        console.error("Кнопка для скачивания не найдена!");
        return;
    }

    downloadAllBtn.addEventListener("click", async () => {
        console.log("Клик по кнопке 'Скачать все изображения'");
        const categoryId = 1; // Здесь вы можете указать пример ID категории или использовать динамически выбранный ID.

        try {
            const response = await fetch(`/category/${categoryId}/download`, { method: "GET" });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "images.zip";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                console.log("Архив успешно скачан.");
            } else {
                console.error("Ошибка скачивания архива. Статус:", response.status);
            }
        } catch (error) {
            console.error("Ошибка сети при скачивании архива:", error);
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
