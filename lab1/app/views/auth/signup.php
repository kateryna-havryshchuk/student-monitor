<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up</title>
    <link rel="stylesheet" href="/lab1/public/style.css">
</head>
<body class="login">
    <div class="modal login-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Sign Up</h2>
            </div>
            <div class="modal-body">
                <form id="signupForm" method="post" action="/lab1/index.php?url=auth/signup">
                    <div class="form-group">
                        <label for="firstname">First Name</label>
                        <input type="text" id="firstname" name="firstname" required placeholder="Enter your first name">
                    </div>
                    <div class="form-group">
                        <label for="lastname">Last Name</label>
                        <input type="text" id="lastname" name="lastname" required placeholder="Enter your last name">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required placeholder="Enter your password">
                    </div>
                    <div class="form-group">
                        <p>Already have an account? <a href="/lab1/index.php?url=auth/login">Login</a></p>
                    </div>
                    <?php if (isset($_SESSION['signup_error'])): ?>
                        <div class="error-message"><?php echo $_SESSION['signup_error']; unset($_SESSION['signup_error']); ?></div>
                    <?php endif; ?>
                    <?php if (isset($_SESSION['signup_success'])): ?>
                        <div class="success-message"><?php echo $_SESSION['signup_success']; unset($_SESSION['signup_success']); ?></div>
                    <?php endif; ?>
                </form>
            </div>
            <div class="modal-footer">
                <button type="submit" form="signupForm" class="okBtn">Sign Up</button>
            </div>
        </div>
    </div>
</body>
</html>