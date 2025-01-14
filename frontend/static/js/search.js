export function initializeSearchCategories() {
    
    const searchInput = document.getElementById('search-input');
    const foldersContainer = document.getElementById('folders');
    const folders = foldersContainer.getElementsByClassName('folder-image-see');

    function filterCategories(searchText){
        searchText = searchText.toLowerCase(); // Приводим текст к нижнему регистру

        for (let folder of folders) {
            const folderName = folder.querySelector('p.text-xl').textContent.toLowerCase();
            if (folderName.includes(searchText)) {
                folder.style.display = '';
            } else {
                folder.style.display = 'none';
            }
        }
    }

    // Обработчик события поиска
    searchInput.addEventListener('input', (event) => {
        const searchText = event.target.value;
        filterCategories(searchText);
    });

}