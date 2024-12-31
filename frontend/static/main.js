document.addEventListener("DOMContentLoaded", () => {
    const createCategoryBtn = document.getElementById("create-category-btn");
    const createCategoryForm = document.getElementById("create-category-form");
    const cancelCreateCategory = document.getElementById("cancel-create-category");
    const newCategoryForm = document.getElementById("new-category-form");
    const foldersContainer = document.getElementById("folders");

    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("file-input");

    const categorySelect = document.getElementById("category-select");
    const imagesContainer = document.getElementById("images-container"); // Контейнер для изображений

    
    // Проверка наличия необходимых элементов
    if (!createCategoryBtn || !createCategoryForm || !foldersContainer || !dropArea || !fileInput || !categorySelect) {
        console.error("Необходимые элементы не найдены в DOM.");
        return;
    }
    
    // Показать форму создания категории
    createCategoryBtn.addEventListener("click", () => {
        createCategoryForm.classList.remove("hidden");
    });

    // Скрыть форму создания категории
    cancelCreateCategory.addEventListener("click", () => {
        createCategoryForm.classList.add("hidden");
    });

    // Обработка отправки формы создания категории
    newCategoryForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(newCategoryForm);
        const name = formData.get("name");
        const description = formData.get("description");

        try {
            const response = await fetch("/category/", {
                method: "POST",
                body: new URLSearchParams({ name, description }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            if (response.ok) {
                const data = await response.json();
                const newCategory = document.createElement("div");
                newCategory.className = "p-4 bg-white rounded-lg shadow-md";
                newCategory.id = `folder-${data.category_id}`;
                newCategory.innerHTML = `
                    <p class="font-semibold">${name}</p>
                    <a href="/category/${data.category_id}/images" class="text-blue-500 hover:underline">Открыть</a>
                    <button class="delete-category-btn" data-folder-id="${data.category_id}">Удалить</button>
                `;
                foldersContainer.appendChild(newCategory);
                createCategoryForm.classList.add("hidden");
                newCategoryForm.reset();
            } else {
                console.error("Ошибка при создании категории");
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
        }
    });

    // Удаление категории
    foldersContainer.addEventListener("click", async (event) => {
        const button = event.target.closest(".delete-category-btn");
        if (!button) return;

        const categoryId = button.getAttribute("data-folder-id");
        if (!categoryId) return;

        if (confirm("Вы уверены, что хотите удалить эту категорию?")) {
            try {
                const response = await fetch(`/category/${categoryId}`, { method: "DELETE" });
                if (response.ok) {
                    const categoryElement = document.querySelector(`#folder-${categoryId}`);
                    if (categoryElement) categoryElement.remove();
                } else {
                    console.error("Ошибка при удалении категории.");
                }
            } catch (error) {
                console.error("Ошибка сети:", error);
            }
        }
    });

    // Обработка загрузки нескольких файлов
    async function handleFiles(files) {
        const categoryId = categorySelect.value;
        if (!categoryId) {
            console.error("Не выбрана категория.");
            return;
        }
    
        const formData = new FormData();
        for (const file of files) {
            formData.append("images", file); // Ключ "images" должен совпадать
        }
        formData.append("category_id", categoryId);
    
        try {
            const response = await fetch("/upload/", {
                method: "POST",
                body: formData,
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("Загруженные изображения:", data.uploaded_images);
            } else {
                const error = await response.json();
                console.error("Ошибка:", error);
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
        }
    }

    // Drag-and-drop и выбор файлов
    ["dragover", "dragleave", "drop"].forEach((eventName) => {
        dropArea.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropArea.classList.toggle("bg-gray-200", eventName === "dragover");
        });
    });

    dropArea.addEventListener("drop", (event) => {
        const files = Array.from(event.dataTransfer.files);
        handleFiles(files);
    });

    dropArea.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        const files = Array.from(fileInput.files);
        handleFiles(files);
    });

    // Загрузка и отображение изображений
    async function fetchImages(categoryId) {
        try {
            const response = await fetch(`/category/${categoryId}/images`);
            if (response.ok) {
                const images = await response.json();

                // Очистка контейнера перед добавлением изображений
                imagesContainer.innerHTML = "";

                // Добавление изображений в порядке загрузки
                images.forEach((image) => {
                    const imageElement = document.createElement("img");
                    imageElement.src = image.url;
                    imageElement.alt = image.name;
                    imageElement.className = "uploaded-image-preview";
                    imagesContainer.appendChild(imageElement);
                });
            } else {
                console.error("Ошибка загрузки изображений.");
            }
        } catch (error) {
            console.error("Ошибка сети при получении изображений:", error);
        }
    }
});
