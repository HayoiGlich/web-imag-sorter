//import { initializeWebSocket } from "./websocket.js";
import { initializeFileUpload } from "./file_upload.js";
import { initializeCategories } from "./categories.js";

document.addEventListener("DOMContentLoaded", () => {
    // Инициализация модулей
    //initializeWebSocket();
    initializeFileUpload();
    initializeCategories();
    
});