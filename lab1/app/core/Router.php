<?php

class Router
{
    public function route()
    {
        $url = $_GET['url'] ?? 'home/index';
        $parts = explode('/', $url);

        $controllerName = ucfirst($parts[0]) . 'Controller';
        $method = $parts[1] ?? 'index';

        $controllerPath = "app/controllers/$controllerName.php";

        if (file_exists($controllerPath)) {
            require_once $controllerPath;
            $controller = new $controllerName();

            if (method_exists($controller, $method)) {
                $controller->$method();
            } else {
                echo "Метод не знайдено.";
            }
        } else {
            echo "Контролер не знайдено.";
        }
    }
}
