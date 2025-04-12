<?php
require_once 'app/models/User.php';

class AuthController
{
    public function showSignup()
    {
        include 'app/views/auth/signup.php';
    }

    public function login()
    {
        session_start();
        $userModel = new User();

        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                echo json_encode(['success' => false, 'message' => 'Invalid JSON format']);
                return;
            }

            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';

            if (empty($email) || empty($password)) {
                echo json_encode(['success' => false, 'message' => 'Email and password are required']);
                return;
            }

            $user = $userModel->findByEmail($email);

            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user'] = $user;
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
            }
        } catch (Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
    }

    public function signup()
    {
        $userModel = new User();
        $hashedPassword = password_hash($_POST['password'], PASSWORD_BCRYPT);
        if ($userModel->findByEmail($_POST['email'])) {
            echo "User with this email already exists.";
            return;
        }

        $userModel->create([
            'firstname' => $_POST['firstname'],
            'lastname' => $_POST['lastname'],
            'email' => $_POST['email'],
            'password' => $hashedPassword
        ]);

        header('Location: /');
    }

    public function logout()
    {
        session_start();
        session_destroy();
        header('Location: /');
    }
}
