<?php
error_log("AuthController.php loaded");

if (!file_exists('app/models/User.php')) {
    error_log("User.php not found at app/models/User.php");
    die("Error: User.php not found");
}
require_once 'app/models/User.php';
require_once __DIR__ . '/../models/Student.php'; // Add this line to include the Student model

class AuthController
{
    public function login()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        error_log("AuthController::login called, method: " . $_SERVER['REQUEST_METHOD']);

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            error_log("Rendering login page (GET request)");
            $this->renderLogin();
            return;
        }

        try {
            $email = isset($_POST['email']) ? trim($_POST['email']) : '';
            $password = $_POST['password'] ?? '';

            error_log("Login attempt: email=$email, password=$password");

            if (empty($email) || empty($password)) {
                $_SESSION['login_error'] = 'Email and password are required';
                error_log("Login failed: Empty email or password");
                $this->renderLogin();
                return;
            }

            $userModel = new User();
            $user = $userModel->findByEmail($email);

            if (!$user) {
                $_SESSION['login_error'] = 'User not found. Please sign up.';
                error_log("Login failed: User not found for email=$email");
                header('Location: /lab1/index.php?url=auth/signup');
                exit;
            }

            error_log("User found: " . print_r($user, true));
            error_log("Verifying password: input=$password, stored={$user['password']}");

            if (password_verify($password, $user['password'])) {
                unset($user['password']);
                $_SESSION['user'] = $user; // $user is from the 'users' table

                // Attempt to find the corresponding student_id for chat
                $studentModel = new Student();
                $studentLinkedToUser = null;
                
                // Try to find a student by matching firstname and lastname (case-insensitive)
                // This is a basic approach. A more robust system might involve a direct link
                // (e.g., a student_id foreign key in the users table) established during registration.
                $allStudents = $studentModel->getAllStudents(); // Your Student model already normalizes names here
                foreach ($allStudents as $student) {
                    if (strtolower($student['firstname']) === strtolower($user['firstname']) &&
                        strtolower($student['lastname']) === strtolower($user['lastname'])) {
                        $studentLinkedToUser = $student;
                        break;
                    }
                }

                if ($studentLinkedToUser && isset($studentLinkedToUser['id'])) {
                    // Found a corresponding student. Use their ID for the chat.
                    $_SESSION['user']['chat_user_id'] = (int)$studentLinkedToUser['id'];
                    error_log("Login: User {$user['email']} (users.id {$user['id']}) linked to student.id {$studentLinkedToUser['id']} for chat.");
                } else {
                    // No corresponding student record found by name, or linking failed.
                    // Fallback to using the users.id. This could be the source of the issue
                    // if this user *is* a student but the name match failed or isn't unique.
                    $_SESSION['user']['chat_user_id'] = (int)$user['id'];
                    error_log("Login: User {$user['email']} (users.id {$user['id']}). No specific student link found by name for chat; using users.id {$user['id']}. This might be an issue if the user is a student with a different students.id.");
                }

                $_SESSION['login_success'] = 'Login successful';
                error_log("Login successful for email=$email, chat_user_id set to {$_SESSION['user']['chat_user_id']}, redirecting to student/index");
                header('Location: /lab1/index.php?url=student/index');
                exit;
            } else {
                $_SESSION['login_error'] = 'Invalid password';
                error_log("Login failed: Invalid password for email=$email");
                $this->renderLogin();
            }
        } catch (Exception $e) {
            $_SESSION['login_error'] = 'Server error: ' . $e->getMessage();
            error_log("Login error: " . $e->getMessage());
            $this->renderLogin();
        }
    }

    private function renderLogin()
    {
        error_log("Rendering login template: app/views/auth/login.php");
        if (!file_exists('app/views/auth/login.php')) {
            error_log("Error: Login template not found at app/views/auth/login.php");
            die("Error: Login template not found");
        }
        require 'app/views/auth/login.php';
        exit;
    }

    public function signup()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        error_log("AuthController::signup called, method: " . $_SERVER['REQUEST_METHOD']);

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            error_log("Rendering signup page (GET request)");
            require 'app/views/auth/signup.php';
            return;
        }

        try {
            $email = trim($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';
            $firstname = trim($_POST['firstname'] ?? '');
            $lastname = trim($_POST['lastname'] ?? '');

            error_log("Signup attempt: email=$email");

            if (empty($email) || empty($password) || empty($firstname) || empty($lastname)) {
                $_SESSION['signup_error'] = 'All fields are required';
                error_log("Signup failed: Missing fields");
                require 'app/views/auth/signup.php';
                return;
            }

            $userModel = new User();
            $existingUser = $userModel->findByEmail($email);
            if ($existingUser) {
                $_SESSION['signup_error'] = 'Email already registered';
                error_log("Signup failed: Email already registered ($email)");
                require 'app/views/auth/signup.php';
                return;
            }

            // Хешування пароля перед збереженням
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            error_log("Hashed password for $email: $hashedPassword");

            $userData = [
                'firstname' => $firstname,
                'lastname' => $lastname,
                'email' => $email,
                'password' => $hashedPassword
            ];

            if ($userModel->create($userData)) {
                $_SESSION['login_success'] = 'Registration successful. Please log in.';
                error_log("Signup successful for email=$email, redirecting to auth/login");
                header('Location: /lab1/index.php?url=auth/login');
                exit;
            } else {
                $_SESSION['signup_error'] = 'Failed to register user';
                error_log("Signup failed: Could not create user");
                require 'app/views/auth/signup.php';
            }
        } catch (Exception $e) {
            $_SESSION['signup_error'] = 'Server error: ' . $e->getMessage();
            error_log("Signup error: " . $e->getMessage());
            require 'app/views/auth/signup.php';
        }
    }

    public function logout()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        error_log("AuthController::logout called");

        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        error_log("User logged out, redirecting to home/index");
        header('Location: /lab1/index.php?url=home/index');
        exit;
    }
}