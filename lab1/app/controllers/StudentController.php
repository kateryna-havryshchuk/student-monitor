<?php
require_once __DIR__ . "/../core/Database.php";
require_once __DIR__ . "/../models/Student.php";

class StudentController
{
    private $studentModel;

    public function __construct()
    {
        $this->studentModel = new Student();
        session_start(); // Ініціалізація сесії один раз
    }

    /**
     * Show the main student list page (доступний всім)
     */
    public function index()
    {
        session_start();
        $isLoggedIn = isset($_SESSION['user']);
    
        $students = $this->studentModel->getAllStudents();
        require __DIR__ . '/../views/home/index.php';
    }

    /**
     * Get a specific student by ID (API, доступний всім)
     */
    public function getStudent($id)
    {
        $student = $this->studentModel->getStudentById($id);
        
        if ($student) {
            echo json_encode(['success' => true, 'student' => $student]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Student not found']);
        }
    }

    /**
     * Add a new student (доступно тільки залогіненим)
     */
    public function addStudent($data)
    {
        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        if (empty($data['group']) || empty($data['firstName']) || 
            empty($data['lastName']) || empty($data['gender']) || 
            empty($data['birthday'])) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        $result = $this->studentModel->addStudent(
            $data['group'],
            $data['firstName'],
            $data['lastName'],
            $data['gender'],
            $data['birthday']
        );

        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Student added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add student']);
        }
    }

    /**
     * Update an existing student (доступно тільки залогіненим)
     */
    public function updateStudent($data)
    {
        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        if (empty($data['id']) || empty($data['group']) || empty($data['firstName']) || 
            empty($data['lastName']) || empty($data['gender']) || 
            empty($data['birthday'])) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        $result = $this->studentModel->updateStudent(
            $data['id'],
            $data['group'],
            $data['firstName'],
            $data['lastName'],
            $data['gender'],
            $data['birthday']
        );

        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Student updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update student']);
        }
    }

    /**
     * Delete a student (доступно тільки залогіненим)
     */
    public function deleteStudent($id)
    {
        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        if (empty($id)) {
            echo json_encode(['success' => false, 'message' => 'Student ID is required']);
            return;
        }

        $result = $this->studentModel->deleteStudent($id);

        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Student deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete student']);
        }
    }
}
