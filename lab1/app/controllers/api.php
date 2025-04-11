<?php

require_once __DIR__ . '/StudentController.php';

header('Content-Type: application/json');
$response = ['success' => true, 'message' => 'Student deleted'];


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
    echo json_encode(['success' => false, 'message' => 'Server error:' . $e->getMessage()]);
}