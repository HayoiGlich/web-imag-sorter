export function initializeFileUpload() {
    const dropAreas = document.querySelectorAll(".drop-area");

    if (!dropAreas.length) {
        console.error("Зоны загрузки файлов не найдены.");
        return;
    }

    async function handleFiles(files, categoryId) {
        if (!categoryId) {
            console.error("ID категории отсутствует.");
            return;
        }

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));
        formData.append("category_id", categoryId);

        try {
            const response = await fetch("/upload/", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Загруженные изображения:", data.uploaded_images);
                const folderElement = document.querySelector(`#folder-${categoryId} .image-count`);
                if (folderElement) {
                    const currentCount = parseInt(folderElement.textContent.replace("Файлов: ", "")) || 0;
                    folderElement.textContent = `Файлов: ${currentCount + data.uploaded_images.length}`;
                }
            } else {
                console.error("Ошибка при загрузке файлов.");
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
        }
    }

    dropAreas.forEach((dropArea) => {
        const fileInput = dropArea.querySelector(".file-input");
        const categoryId = dropArea.getAttribute("data-folder-id");

        if (!fileInput || !categoryId) {
            console.error("Не найдены необходимые элементы в зоне загрузки.");
            return;
        }

        ["dragover", "dragleave", "drop"].forEach((eventName) => {
            dropArea.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropArea.classList.toggle("bg-gray-200", eventName === "dragover");
            });
        });

        dropArea.addEventListener("drop", (event) => {
            const files = Array.from(event.dataTransfer.files);
            handleFiles(files, categoryId);
        });

        dropArea.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", () => {
            const files = Array.from(fileInput.files);
            handleFiles(files, categoryId);
        });
    });
}
