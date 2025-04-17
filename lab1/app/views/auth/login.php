<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

error_log("Loading login template: app/views/auth/login.php");
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="stylesheet" href="/lab1/public/style.css">
</head>
<body class="login">
    <div class="modal login-modal">
        <a href="/lab1/index.php?url=student/index" class="home-btn">Home</a>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Login</h2>
            </div>
            <div class="modal-body">
                <form id="loginForm" method="post" action="/lab1/index.php?url=auth/login">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required placeholder="Enter your password">
                    </div>
                    <div class="form-group">
                        <p>Don't have an account? <a href="/lab1/index.php?url=auth/signup">Sign up</a></p>
                    </div>
                    <?php if (isset($_SESSION['login_error'])): ?>
                        <div class="error-message"><?php echo $_SESSION['login_error']; unset($_SESSION['login_error']); ?></div>
                    <?php endif; ?>
                    <?php if (isset($_SESSION['login_success'])): ?>
                        <div class="success-message"><?php echo $_SESSION['login_success']; unset($_SESSION['login_success']); ?></div>
                    <?php endif; ?>
                    <div class="modal-footer">
                        <button type="submit" form="loginForm" class="okBtn">Login</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>