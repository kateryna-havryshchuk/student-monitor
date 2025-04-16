<?php
error_log("api.php loaded");

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!file_exists('app/controllers/StudentController.php')) {
    error_log("StudentController.php not found at app/controllers/StudentController.php");
    die(json_encode(['success' => false, 'message' => 'StudentController.php not found']));
}
require_once 'app/controllers/StudentController.php';

header('Content-Type: application/json');

// Create a new student controller
$controller = new StudentController();

try {
    // Handle API requests
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // GET request for retrieving a student
        if (isset($_GET['action']) && $_GET['action'] === 'getStudent' && isset($_GET['id'])) {
            $controller->getStudent((int)$_GET['id']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid GET request']);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // POST request for add/update/delete operations
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['action'])) {
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
                    echo json_encode(['success' => false, 'message' => 'Unknown action']);
                    break;
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'No action specified']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    error_log("API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}