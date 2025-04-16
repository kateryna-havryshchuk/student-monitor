<?php
error_log("Router.php loaded");

class Router
{
    public function route()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $url = isset($_GET['url']) ? trim($_GET['url'], '/') : 'student/index';
        error_log("Routing URL: $url");

        switch ($url) {
            case 'auth/login':
                error_log("Handling auth/login");
                if (!file_exists('app/controllers/AuthController.php')) {
                    error_log("AuthController.php not found");
                    die("Error: AuthController.php not found");
                }
                require_once 'app/controllers/AuthController.php';
                $controller = new AuthController();
                $controller->login();
                return;
            case 'auth/logout':
                error_log("Handling auth/logout");
                require_once 'app/controllers/AuthController.php';
                $controller = new AuthController();
                $controller->logout();
                return;
            case 'auth/signup':
                error_log("Handling auth/signup");
                require_once 'app/controllers/AuthController.php';
                $controller = new AuthController();
                $controller->signup();
                return;
            case 'api':
                error_log("Handling api");
                if (!file_exists('api.php')) {
                    error_log("api.php not found");
                    die("Error: api.php not found");
                }
                require_once 'api.php';
                return;
        }

        $parts = explode('/', $url);
        $controllerName = ucfirst($parts[0]) . 'Controller';
        $method = isset($parts[1]) ? $parts[1] : 'index';
        $controllerPath = "app/controllers/{$controllerName}.php";

        error_log("Looking for controller: $controllerPath, method: $method");

        if (file_exists($controllerPath)) {
            require_once $controllerPath;
            $controller = new $controllerName();
            if (method_exists($controller, $method)) {
                error_log("Executing $controllerName::$method");
                $controller->$method();
            } else {
                error_log("Method not found: $method");
                $this->returnError("Method not found");
            }
        } else {
            error_log("Controller not found: $controllerPath");
            $this->returnError("Controller not found");
        }
    }

    private function returnError($message)
    {
        error_log("Routing error: $message");
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }
}