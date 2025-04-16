<?php
require_once __DIR__ . "/../core/Database.php";
require_once __DIR__ . "/../models/Student.php";

class StudentController
{
    private $studentModel;

    public function __construct()
    {
        $this->studentModel = new Student();
    }

    public function index()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $students = $this->studentModel->getAllStudents();
        $isLoggedIn = isset($_SESSION['user']);
        $username = $isLoggedIn ? htmlspecialchars($_SESSION['user']['firstname'] . ' ' . $_SESSION['user']['lastname']) : null;

        require __DIR__ . '/../views/home/index.php';
    }

    public function handleApi()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        header('Content-Type: application/json');
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? $_GET['action'] ?? '';

        switch ($action) {
            case 'getStudent':
                $id = $_GET['id'] ?? '';
                $student = $this->studentModel->getStudentById($id);
                echo json_encode($student ? ['success' => true, 'student' => $student] : ['success' => false, 'message' => 'Student not found']);
                break;

            case 'add':
                if (!isset($_SESSION['user'])) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    break;
                }
                if (empty($data['group']) || empty($data['firstName']) || empty($data['lastName']) || empty($data['gender']) || empty($data['birthday'])) {
                    echo json_encode(['success' => false, 'message' => 'All fields are required']);
                    break;
                }
                $result = $this->studentModel->addStudent($data['group'], $data['firstName'], $data['lastName'], $data['gender'], $data['birthday']);
                echo json_encode($result ? ['success' => true, 'message' => 'Student added'] : ['success' => false, 'message' => 'Failed to add student']);
                break;

            case 'update':
                if (!isset($_SESSION['user'])) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    break;
                }
                if (empty($data['id']) || empty($data['group']) || empty($data['firstName']) || empty($data['lastName']) || empty($data['gender']) || empty($data['birthday'])) {
                    echo json_encode(['success' => false, 'message' => 'All fields are required']);
                    break;
                }
                $result = $this->studentModel->updateStudent($data['id'], $data['group'], $data['firstName'], $data['lastName'], $data['gender'], $data['birthday']);
                echo json_encode($result ? ['success' => true, 'message' => 'Student updated'] : ['success' => false, 'message' => 'Failed to update student']);
                break;

            case 'delete':
                if (!isset($_SESSION['user'])) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    break;
                }
                $id = $data['id'] ?? '';
                $result = $this->studentModel->deleteStudent($id);
                echo json_encode($result ? ['success' => true, 'message' => 'Student deleted'] : ['success' => false, 'message' => 'Failed to delete student']);
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        exit;
    }
}