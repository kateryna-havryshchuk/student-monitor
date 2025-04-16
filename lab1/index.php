<?php
// Вмикаємо відображення помилок
error_reporting(E_ALL);
ini_set('display_errors', 1);
error_log("index.php loaded");

// Ініціалізація сесії
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
error_log("Session started, ID: " . session_id());

// Автозавантаження класів
spl_autoload_register(function ($class) {
    $class = str_replace('\\', '/', $class);
    $paths = [
        "app/{$class}.php",
        "app/core/{$class}.php",
        "app/controllers/{$class}.php",
        "app/models/{$class}.php",
        "app/views/{$class}.php"
    ];

    foreach ($paths as $path) {
        if (file_exists($path)) {
            error_log("Autoloading class: $path");
            require_once $path;
            return;
        }
    }
    error_log("Failed to autoload class: $class");
});

// Ініціалізація та запуск роутера
if (!file_exists('app/core/Router.php')) {
    error_log("Router.php not found at app/core/Router.php");
    die("Error: Router.php not found");
}
require_once 'app/core/Router.php';
error_log("Router initialized");
$router = new Router();
$router->route();
?>