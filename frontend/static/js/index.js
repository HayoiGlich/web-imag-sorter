//import { initializeWebSocket } from "./websocket.js";
import { initializeFileUpload } from "./file_upload.js";
import { initializeCategories } from "./categories.js";
import { initializeDownloadsAll } from "./downloadall.js";
import { initializeSearchCategories } from "./search.js";

document.addEventListener("DOMContentLoaded", () => {
    // Инициализация модулей
    //initializeWebSocket();
    initializeFileUpload();
    initializeCategories();
    initializeDownloadsAll();
    initializeSearchCategories();
});
