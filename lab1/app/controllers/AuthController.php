<?php
require_once 'app/models/User.php';

class AuthController
{
    public function login()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Якщо не POST — редирект на головну (де форма)
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /home/index');
            exit;
        }

        try {
            $email = isset($_POST['email']) ? trim($_POST['email']) : '';
            $password = $_POST['password'] ?? '';

            if (empty($email) || empty($password)) {
                $_SESSION['login_error'] = 'Email and password are required';
                header('Location: /home/index');
                exit;
            }

            $userModel = new User();
            $user = $userModel->findByEmail($email);

            if ($user && password_verify($password, $user['password'])) {
                unset($user['password']);
                $_SESSION['user'] = $user;
                $_SESSION['login_success'] = 'Login successful';
            } else {
                $_SESSION['login_error'] = 'Invalid email or password';
            }

            header('Location: /home/index');
            exit;
        } catch (Exception $e) {
            $_SESSION['login_error'] = 'Server error: ' . $e->getMessage();
            header('Location: /home/index');
            exit;
        }
    }
    
    public function logout()
    {
        // Start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Clear session data
        $_SESSION = [];
        
        // Clear session cookie
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
        
        // Destroy session
        session_destroy();
        
        // Redirect to home page
        header('Location: /home/index');
        exit;
    }
}