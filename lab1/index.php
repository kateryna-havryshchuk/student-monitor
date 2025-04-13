<?php

require_once 'app/core/Router.php';
require_once 'app/core/Database.php';
require_once 'app/core/Controller.php';

define('BASE_URL', '/lab1/#'); // або '' якщо ти в самому корені

// Автозавантаження класів
spl_autoload_register(function ($class) {
    $path = "app/$class.php";
    if (file_exists($path)) {
        require_once $path;
    }
});

$router = new Router();
$router->route();

