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
                $this->getStudent($_GET['id'] ?? '');
                break;

            case 'add':
                $this->addStudent($data);
                break;

            case 'update':
                $this->updateStudent($data);
                break;

            case 'delete':
                if (!isset($_SESSION['user'])) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    break;
                }
                $this->deleteStudent($data['id'] ?? '');
                break;

            case 'deleteMultiple':
                if (!isset($_SESSION['user'])) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    break;
                }
                $this->deleteMultipleStudents($data['ids'] ?? []);
                break;
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        exit;
    }

    public function getStudentsAjax()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        header('Content-Type: application/json');

        // Pagination settings
        $recordsPerPage = 6;
        $currentPage = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int) $_GET['page']) : 1;

        try {
            // Get paginated data
            $students = $this->studentModel->getPaginatedStudents($currentPage, $recordsPerPage);
            $totalRecords = $this->studentModel->getTotalStudentsCount();
            $totalPages = ceil($totalRecords / $recordsPerPage);

            // Add isActive flag for students matching the logged-in user's name
            $username = isset($_SESSION['user']) ? htmlspecialchars($_SESSION['user']['firstname'] . ' ' . $_SESSION['user']['lastname']) : null;
            $students = array_map(function ($student) use ($username) {
                $student['isActive'] = $username && ($student['firstname'] . ' ' . $student['lastname']) === $username;
                return $student;
            }, $students);

            echo json_encode([
                'success' => true,
                'students' => $students,
                'currentPage' => $currentPage,
                'totalPages' => $totalPages
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error fetching students: ' . $e->getMessage()
            ]);
        }
        exit;
    }

    public function getStudent($id)
    {
        $student = $this->studentModel->getStudentById($id);
        echo json_encode($student ? ['success' => true, 'student' => $student] : ['success' => false, 'message' => 'Student not found']);
    }

    public function addStudent($data)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        $validation = $this->validateStudentData($data);
        $errors = $validation['errors'];
        $cleanedData = $validation['cleanedData'];

        if (empty($errors)) {
            // Check for duplicate student
            if ($this->studentModel->checkDuplicateStudent(
                $cleanedData['firstName'],
                $cleanedData['lastName'],
                $cleanedData['birthday']
            )) {
                echo json_encode(['success' => false, 'duplicate' => true, 'message' => 'A student with the same name and birthday already exists']);
                return;
            }

            $result = $this->studentModel->addStudent(
                $cleanedData['group'],
                $cleanedData['firstName'],
                $cleanedData['lastName'],
                $cleanedData['gender'],
                $cleanedData['birthday']
            );
            echo json_encode($result ? ['success' => true, 'message' => 'Student added successfully'] : ['success' => false, 'message' => 'Failed to add student']);
        } else {
            echo json_encode(['success' => false, 'errors' => $errors]);
        }
    }

    public function updateStudent($data)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        $validation = $this->validateStudentData($data, true);
        $errors = $validation['errors'];
        $cleanedData = $validation['cleanedData'];

        if (empty($errors)) {
            $result = $this->studentModel->updateStudent(
                $cleanedData['id'],
                $cleanedData['group'],
                $cleanedData['firstName'],
                $cleanedData['lastName'],
                $cleanedData['gender'],
                $cleanedData['birthday']
            );
            echo json_encode($result ? ['success' => true, 'message' => 'Student updated successfully'] : ['success' => false, 'message' => 'Failed to update student']);
        } else {
            echo json_encode(['success' => false, 'errors' => $errors]);
        }
    }

    public function deleteStudent($id)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        if (empty($id) || !is_numeric($id)) {
            echo json_encode(['success' => false, 'message' => 'Invalid student ID']);
            return;
        }
        $result = $this->studentModel->deleteStudent($id);
        echo json_encode($result ? ['success' => true, 'message' => 'Student deleted successfully'] : ['success' => false, 'message' => 'Failed to delete student']);
    }

    public function deleteMultipleStudents($ids)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        if (empty($ids) || !is_array($ids)) {
            echo json_encode(['success' => false, 'message' => 'Invalid student IDs']);
            return;
        }

        // Filter to ensure only numeric IDs
        $ids = array_filter($ids, function ($id) {
            return is_numeric($id);
        });

        if (empty($ids)) {
            echo json_encode(['success' => false, 'message' => 'No valid student IDs provided']);
            return;
        }

        $result = $this->studentModel->deleteMultipleStudents($ids);
        echo json_encode($result ?
            ['success' => true, 'message' => count($ids) . ' students deleted successfully'] :
            ['success' => false, 'message' => 'Failed to delete students']);
    }

    private function validateStudentData($data, $isUpdate = false)
    {
        $group = htmlspecialchars(strip_tags(trim($data['group'] ?? '')));
        $firstName = htmlspecialchars(strip_tags(trim($data['firstName'] ?? '')));
        $lastName = htmlspecialchars(strip_tags(trim($data['lastName'] ?? '')));
        $gender = htmlspecialchars(strip_tags(trim($data['gender'] ?? '')));
        $birthday = htmlspecialchars(strip_tags(trim($data['birthday'] ?? '')));
        $id = isset($data['id']) ? htmlspecialchars(strip_tags(trim($data['id'] ?? ''))) : null;

        $errors = [];

        if ($isUpdate && (empty($id) || !is_numeric($id))) {
            $errors['id'] = "Invalid student ID.";
        }

        if (empty($group) && array_filter($data) === []) {
        } else if (empty($group) || !in_array($group, ['PZ-21', 'PZ-22', 'PZ-23', 'PZ-24', 'PZ-25', 'PZ-26'])) {
            $errors['group'] = "Invalid group. Please select a valid group.";
        }

        if (empty($firstName) || strlen($firstName) < 2) {
            $errors['firstName'] = "First name must be at least 2 characters long.";
        } elseif (!preg_match('/^[a-zA-Zа-щА-ЩьЬюЮяЯіІїЇєЄґҐ]+(-[a-zA-Zа-щА-ЩьЬюЮяЯіІїЇєЄґҐ]+)?$/u', $firstName)) {
            $errors['firstName'] = "First name can only contain letters.";
        }

        if (empty($lastName) || strlen($lastName) < 2) {
            $errors['lastName'] = "Last name must be at least 2 characters long.";
        } elseif (!preg_match('/^[a-zA-Zа-щА-ЩьЬюЮяЯіІїЇєЄґҐ]+(-[a-zA-Zа-щА-ЩьЬюЮяЯіІїЇєЄґҐ]+)?$/u', $lastName)) {
            $errors['lastName'] = "Last name can only contain letters.";
        }

        if (empty($gender) || !in_array($gender, ['M', 'F'])) {
            $errors['gender'] = "Please select a valid gender.";
        }

        if (empty($birthday)) {
            $errors['birthday'] = "Birthday is required.";
        } else {
            try {
                $birthDate = new DateTime($birthday);
                $today = new DateTime();
                if ($birthDate > $today) {
                    $errors['birthday'] = "Birthday cannot be in the future.";
                } elseif ($today->diff($birthDate)->y < 15) {
                    $errors['birthday'] = "Student must be at least 15 years old.";
                }
            } catch (Exception $e) {
                $errors['birthday'] = "Invalid birthday format.";
            }
        }

        return [
            'errors' => $errors,
            'cleanedData' => [
                'id' => $id,
                'group' => $group,
                'firstName' => $firstName,
                'lastName' => $lastName,
                'gender' => $gender,
                'birthday' => $birthday
            ]
        ];
    }
}