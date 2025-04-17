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

                $group = htmlspecialchars(strip_tags(trim($data['group'] ?? '')));
                $firstName = htmlspecialchars(strip_tags(trim($data['firstName'] ?? '')));
                $lastName = htmlspecialchars(strip_tags(trim($data['lastName'] ?? '')));
                $gender = htmlspecialchars(strip_tags(trim($data['gender'] ?? '')));
                $birthday = htmlspecialchars(strip_tags(trim($data['birthday'] ?? '')));

                $errors = [];

                // Валідація
                if (empty($group) || !in_array($group, ['PZ-21', 'PZ-22', 'PZ-23', 'PZ-24', 'PZ-25', 'PZ-26'])) {
                    $errors[] = "Invalid group.";
                }

                if (empty($firstName) || strlen($firstName) < 2) {
                    $errors[] = "First name must be at least 2 characters long.";
                } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $firstName)) {
                    $errors[] = "First name can only contain letters.";
                }

                if (empty($lastName) || strlen($lastName) < 2) {
                    $errors[] = "Last name must be at least 2 characters long.";
                } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $lastName)) {
                    $errors[] = "Last name can only contain letters.";
                }

                if (empty($gender) || !in_array($gender, ['M', 'F'])) {
                    $errors[] = "Invalid gender.";
                }

                if (empty($birthday)) {
                    $errors[] = "Birthday is required.";
                } else {
                    $birthDate = new DateTime($birthday);
                    $today = new DateTime();
                    if ($birthDate > $today) {
                        $errors[] = "Birthday cannot be in the future.";
                    } elseif ($today->diff($birthDate)->y < 15) {
                        $errors[] = "Student must be at least 15 years old.";
                    }
                }

                if (empty($errors)) {
                    $result = $this->studentModel->addStudent($group, $firstName, $lastName, $gender, $birthday);
                    echo json_encode($result ? ['success' => true, 'message' => 'Student added successfully'] : ['success' => false, 'message' => 'Failed to add student']);
                } else {
                    echo json_encode(['success' => false, 'message' => implode("\n", $errors)]);
                }
                break;

            case 'update':
                if (!isset($_SESSION['user'])) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    break;
                }

                $id = htmlspecialchars(strip_tags(trim($data['id'] ?? '')));
                $group = htmlspecialchars(strip_tags(trim($data['group'] ?? '')));
                $firstName = htmlspecialchars(strip_tags(trim($data['firstName'] ?? '')));
                $lastName = htmlspecialchars(strip_tags(trim($data['lastName'] ?? '')));
                $gender = htmlspecialchars(strip_tags(trim($data['gender'] ?? '')));
                $birthday = htmlspecialchars(strip_tags(trim($data['birthday'] ?? '')));

                $errors = [];

                if (empty($id) || !is_numeric($id)) {
                    $errors[] = "Invalid student ID.";
                }

                if (empty($group) || !in_array($group, ['PZ-21', 'PZ-22', 'PZ-23', 'PZ-24', 'PZ-25', 'PZ-26'])) {
                    $errors[] = "Invalid group.";
                }

                if (empty($firstName) || strlen($firstName) < 2) {
                    $errors[] = "First name must be at least 2 characters long.";
                } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $firstName)) {
                    $errors[] = "First name can only contain letters.";
                }

                if (empty($lastName) || strlen($lastName) < 2) {
                    $errors[] = "Last name must be at least 2 characters long.";
                } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $lastName)) {
                    $errors[] = "Last name can only contain letters.";
                }

                if (empty($gender) || !in_array($gender, ['M', 'F'])) {
                    $errors[] = "Invalid gender.";
                }

                if (empty($birthday)) {
                    $errors[] = "Birthday is required.";
                } else {
                    $birthDate = new DateTime($birthday);
                    $today = new DateTime();
                    if ($birthDate > $today) {
                        $errors[] = "Birthday cannot be in the future.";
                    } elseif ($today->diff($birthDate)->y < 15) {
                        $errors[] = "Student must be at least 15 years old.";
                    }
                }

                if (empty($errors)) {
                    $result = $this->studentModel->updateStudent($id, $group, $firstName, $lastName, $gender, $birthday);
                    echo json_encode($result ? ['success' => true, 'message' => 'Student updated successfully'] : ['success' => false, 'message' => 'Failed to update student']);
                } else {
                    echo json_encode(['success' => false, 'message' => implode("\n", $errors)]);
                }
                break;

            case 'delete':
                if (!isset($_SESSION['user'])) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    break;
                }
                $id = $data['id'] ?? '';
                if (empty($id) || !is_numeric($id)) {
                    echo json_encode(['success' => false, 'message' => 'Invalid student ID']);
                    break;
                }
                $result = $this->studentModel->deleteStudent($id);
                echo json_encode($result ? ['success' => true, 'message' => 'Student deleted successfully'] : ['success' => false, 'message' => 'Failed to delete student']);
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        exit;
    }

    // Методи для виклику з api.php
    public function getStudent($id)
    {
        $student = $this->studentModel->getStudentById($id);
        echo json_encode($student ? ['success' => true, 'student' => $student] : ['success' => false, 'message' => 'Student not found']);
    }

    public function addStudent($data)
    {
        $group = htmlspecialchars(strip_tags(trim($data['group'] ?? '')));
        $firstName = htmlspecialchars(strip_tags(trim($data['firstName'] ?? '')));
        $lastName = htmlspecialchars(strip_tags(trim($data['lastName'] ?? '')));
        $gender = htmlspecialchars(strip_tags(trim($data['gender'] ?? '')));
        $birthday = htmlspecialchars(strip_tags(trim($data['birthday'] ?? '')));

        $errors = [];

        if (empty($group) || !in_array($group, ['PZ-21', 'PZ-22', 'PZ-23', 'PZ-24', 'PZ-25', 'PZ-26'])) {
            $errors[] = "Invalid group.";
        }

        if (empty($firstName) || strlen($firstName) < 2) {
            $errors[] = "First name must be at least 2 characters long.";
        } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $firstName)) {
            $errors[] = "First name can only contain letters.";
        }

        if (empty($lastName) || strlen($lastName) < 2) {
            $errors[] = "Last name must be at least 2 characters long.";
        } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $lastName)) {
            $errors[] = "Last name can only contain letters.";
        }

        if (empty($gender) || !in_array($gender, ['M', 'F'])) {
            $errors[] = "Invalid gender.";
        }

        if (empty($birthday)) {
            $errors[] = "Birthday is required.";
        } else {
            $birthDate = new DateTime($birthday);
            $today = new DateTime();
            if ($birthDate > $today) {
                $errors[] = "Birthday cannot be in the future.";
            } elseif ($today->diff($birthDate)->y < 15) {
                $errors[] = "Student must be at least 15 years old.";
            }
        }

        if (empty($errors)) {
            $result = $this->studentModel->addStudent($group, $firstName, $lastName, $gender, $birthday);
            echo json_encode($result ? ['success' => true, 'message' => 'Student added successfully'] : ['success' => false, 'message' => 'Failed to add student']);
        } else {
            echo json_encode(['success' => false, 'message' => implode("\n", $errors)]);
        }
    }

    public function updateStudent($data)
    {
        $id = htmlspecialchars(strip_tags(trim($data['id'] ?? '')));
        $group = htmlspecialchars(strip_tags(trim($data['group'] ?? '')));
        $firstName = htmlspecialchars(strip_tags(trim($data['firstName'] ?? '')));
        $lastName = htmlspecialchars(strip_tags(trim($data['lastName'] ?? '')));
        $gender = htmlspecialchars(strip_tags(trim($data['gender'] ?? '')));
        $birthday = htmlspecialchars(strip_tags(trim($data['birthday'] ?? '')));

        $errors = [];

        if (empty($id) || !is_numeric($id)) {
            $errors[] = "Invalid student ID.";
        }

        if (empty($group) || !in_array($group, ['PZ-21', 'PZ-22', 'PZ-23', 'PZ-24', 'PZ-25', 'PZ-26'])) {
            $errors[] = "Invalid group.";
        }

        if (empty($firstName) || strlen($firstName) < 2) {
            $errors[] = "First name must be at least 2 characters long.";
        } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $firstName)) {
            $errors[] = "First name can only contain letters.";
        }

        if (empty($lastName) || strlen($lastName) < 2) {
            $errors[] = "Last name must be at least 2 characters long.";
        } elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ]+$/u', $lastName)) {
            $errors[] = "Last name can only contain letters.";
        }

        if (empty($gender) || !in_array($gender, ['M', 'F'])) {
            $errors[] = "Invalid gender.";
        }

        if (empty($birthday)) {
            $errors[] = "Birthday is required.";
        } else {
            $birthDate = new DateTime($birthday);
            $today = new DateTime();
            if ($birthDate > $today) {
                $errors[] = "Birthday cannot be in the future.";
            } elseif ($today->diff($birthDate)->y < 15) {
                $errors[] = "Student must be at least 15 years old.";
            }
        }

        if (empty($errors)) {
            $result = $this->studentModel->updateStudent($id, $group, $firstName, $lastName, $gender, $birthday);
            echo json_encode($result ? ['success' => true, 'message' => 'Student updated successfully'] : ['success' => false, 'message' => 'Failed to update student']);
        } else {
            echo json_encode(['success' => false, 'message' => implode("\n", $errors)]);
        }
    }

    public function deleteStudent($id)
    {
        if (empty($id) || !is_numeric($id)) {
            echo json_encode(['success' => false, 'message' => 'Invalid student ID']);
            return;
        }
        $result = $this->studentModel->deleteStudent($id);
        echo json_encode($result ? ['success' => true, 'message' => 'Student deleted successfully'] : ['success' => false, 'message' => 'Failed to delete student']);
    }
}