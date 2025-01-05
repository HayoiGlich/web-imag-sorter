export function initializeCategories() {
    const createCategoryBtn = document.getElementById("create-category-btn");
    const createCategoryForm = document.getElementById("create-category-form");
    const cancelCreateCategory = document.getElementById("cancel-create-category");
    const newCategoryForm = document.getElementById("new-category-form");
    const foldersContainer = document.getElementById("folders");

    if (!createCategoryBtn || !createCategoryForm || !foldersContainer || !newCategoryForm) {
        console.error("Элементы категорий не найдены.");
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

    // Создание новой категории
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
                addCategoryToUI(data.category_id, name, 0); // Добавляем новую категорию в интерфейс
                createCategoryForm.classList.add("hidden");
                newCategoryForm.reset();
                console.log("Категория создана:", data);
            } else {
                console.error("Ошибка при создании категории.");
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
        }
    });

    // Делегирование событий на контейнере для папок
    foldersContainer.addEventListener("click", function(event) {
        // Обработчик клика на папку
        const folder = event.target.closest(".folder-image-see"); // Ищем элемент с классом folder-image-see
        if (folder && !event.target.closest(".delete-category-btn")) {
            const folderId = folder.id.split('-')[1]; // Извлекаем ID папки
            if (folderId) {
                window.location.href = `/category/${folderId}/images`;
            }
        }

        // Обработчик удаления категории
        const button = event.target.closest(".delete-category-btn");
        if (button) {
            event.preventDefault(); // Останавливаем дальнейшее действие (перенаправление)
            event.stopPropagation(); // Останавливаем всплытие события

            const categoryId = button.getAttribute("data-folder-id");
            if (!categoryId) return;

            if (confirm("Вы уверены, что хотите удалить эту категорию?")) {
                try {
                    const response = await fetch(`/category/${categoryId}`, { method: "DELETE" });

                    if (response.ok) {
                        const categoryElement = document.querySelector(`#folder-${categoryId}`);
                        if (categoryElement) categoryElement.remove();
                        console.log(`Категория с ID ${categoryId} удалена.`);
                    } else {
                        console.error("Ошибка при удалении категории.");
                    }
                } catch (error) {
                    console.error("Ошибка сети:", error);
                }
            }
        }
    });

    // Функция для добавления новой категории в UI
    function addCategoryToUI(categoryId, name, imageCount) {
        const newCategory = document.createElement("div");
        newCategory.className = "folder p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 cursor-pointer folder-image-see";
        newCategory.id = `folder-${categoryId}`;
        newCategory.setAttribute("data-folder-id", categoryId);
        newCategory.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <p class="text-xl font-semibold text-gray-800 dark:text-gray-100">${name}</p>
                <button 
                    class="delete-category-btn text-red-600 hover:underline" 
                    data-folder-id="${categoryId}">
                    <i class="fa fa-trash"></i> Удалить
                </button>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 image-count">
                Файлов: ${imageCount}
            </p>
        `;
        foldersContainer.appendChild(newCategory);
    }
}
