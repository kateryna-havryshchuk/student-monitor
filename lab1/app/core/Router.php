<?php
class Router
{
    public function route()
    {
        // Log request information
        error_log("REQUEST_URI: " . $_SERVER['REQUEST_URI']);
        error_log("QUERY_STRING: " . $_SERVER['QUERY_STRING']);
        error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
        
        // Get the URL parameter
        $url = isset($_GET['url']) ? $_GET['url'] : 'home/index';
        error_log("URL parameter: " . $url);
        
        // Special case for auth/login
        if ($url === 'auth/login') {
            error_log("Handling auth/login endpoint");
            require_once 'app/controllers/AuthController.php';
            $controller = new AuthController();
            $controller->login();
            return;
        }
        
        // Special case for auth/logout
        if ($url === 'auth/logout') {
            error_log("Handling auth/logout endpoint");
            require_once 'app/controllers/AuthController.php';
            $controller = new AuthController();
            $controller->logout();
            return;
        }
        
        // Parse URL for standard routing
        $parts = explode('/', $url);
        $controllerName = ucfirst($parts[0]) . 'Controller';
        $method = isset($parts[1]) ? $parts[1] : 'index';
        $controllerPath = "app/controllers/{$controllerName}.php";
        
        error_log("Looking for controller: " . $controllerPath);
        
        if (file_exists($controllerPath)) {
            error_log("Controller found, loading: " . $controllerPath);
            require_once $controllerPath;
            $controller = new $controllerName();
            
            if (method_exists($controller, $method)) {
                error_log("Method found, executing: " . $method);
                $controller->$method();
            } else {
                error_log("Method not found: " . $method);
                $this->returnError("Method not found");
            }
        } else {
            error_log("Controller not found: " . $controllerPath);
            $this->returnError("Controller not found");
        }
    }
    
    private function returnError($message)
    {
        // Check if request accepts JSON
        if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => $message]);
        } else {
            echo "<h1>Error</h1><p>{$message}</p>";
        }
    }
}