<?php

class Router
{
    public function route()
    {
        // Якщо URI йде напряму, наприклад /login
        $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        error_log("Request URI: " . $_SERVER['REQUEST_URI']); // Log the request URI
        error_log("GET URL: " . ($_GET['url'] ?? 'home/index')); // Log the GET URL

        if (isset($_GET['url']) && $_GET['url'] === 'auth/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            require_once 'app/controllers/AuthController.php';
            (new AuthController())->login();
            return;
        }
        
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
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Method not found']);
            }
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Controller not found']);
        }
    }
}
