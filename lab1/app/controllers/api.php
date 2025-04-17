<?php
ob_start(); // Починаємо буферизацію
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Виправлений шлях до StudentController.php
$controllerPath = __DIR__ . '/StudentController.php';
if (!file_exists($controllerPath)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'StudentController.php not found']);
    exit;
}

// Перевірка, чи файл доступний для читання
if (!is_readable($controllerPath)) {
    error_log("StudentController.php is not readable at $controllerPath");
    echo json_encode(['success' => false, 'message' => 'StudentController.php is not readable']);
    exit;
}

// Обробка помилок при підключенні файлу
try {
    require_once $controllerPath;
    error_log("StudentController.php loaded successfully");
} catch (Throwable $e) {
    error_log("Error including StudentController.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error including StudentController.php: ' . $e->getMessage()]);
    exit;
}

// Create a new student controller
try {
    $controller = new StudentController();
    error_log("StudentController instantiated successfully");
} catch (Exception $e) {
    error_log("Error creating StudentController: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error creating StudentController: ' . $e->getMessage()]);
    exit;
}

try {
    // Handle API requests
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // GET request for retrieving a student
        if (isset($_GET['action']) && $_GET['action'] === 'getStudent' && isset($_GET['id'])) {
            error_log("GET request: action=getStudent, id=" . $_GET['id']);
            $controller->getStudent((int)$_GET['id']);
        } else {
            error_log("Invalid GET request: " . json_encode($_GET));
            echo json_encode(['success' => false, 'message' => 'Invalid GET request']);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // POST request for add/update/delete operations
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['action'])) {
            error_log("POST request: action=" . $data['action']);
            switch ($data['action']) {
                case 'add':
                    $controller->addStudent($data);
                    break;
                case 'update':
                    $controller->updateStudent($data);
                    break;
                case 'delete':
                    $controller->deleteStudent($data['id']);
                    break;
                default:
                    error_log("Unknown action: " . $data['action']);
                    echo json_encode(['success' => false, 'message' => 'Unknown action']);
                    break;
            }
        } else {
            error_log("No action specified in POST request: " . json_encode($data));
            echo json_encode(['success' => false, 'message' => 'No action specified']);
        }
    } else {
        error_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    error_log("API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}