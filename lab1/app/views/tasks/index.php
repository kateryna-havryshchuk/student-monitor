<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$loggedIn = isset($_SESSION['user']);
$username = $loggedIn ? htmlspecialchars($_SESSION['user']['firstname'] . ' ' . $_SESSION['user']['lastname']) : null;

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tasks</title>
    <link rel="icon" href="public/images/favicon-96x96.png" type="image/png">
    <link rel="stylesheet" href="/lab1/public/style.css">
    <script src="https://kit.fontawesome.com/d9209b8d96.js" crossorigin="anonymous"></script>
    <script type="module" src="/lab1/public/index.js"></script>
</head>

<body>
    <div id="wrapper">

    <header>
        <div class="logo">
            <div class="cms-link" id="cms-logo">
                <h4 id="cms">CMS</h4>
            </div>
        </div>
        
        <div class="dropdown-container">
                <?php if ($loggedIn): ?>
                    <div class="notify-dropdown">
                        <button class="notificationBtn" id="notificationBtn" aria-label="notificationBtn">
                            <i class="fa-regular fa-bell fa-xl bell-ringing" id="bellIcon"></i>
                            <span class="icon-button-badge show"></span>
                        </button>
                        <div class="notify-content">
                            <a href="/lab1/index.php?url=messages/index&show_messages=1">
                                <i class="fa-regular fa-user"></i>
                                Victor: How are you?
                            </a>
                            <a href="/lab1/index.php?url=messages/index&show_messages=1">
                                <i class="fa-regular fa-user"></i>
                                Jess: See you then!
                            </a>
                            <a href="/lab1/index.php?url=messages/index&show_messages=1">
                                <i class="fa-regular fa-user"></i>
                                Max: What's up!
                            </a>
                        </div>
                    </div>

                    <div class="user-dropdown">
                        <button class="userBtn" id="userBtn">
                            <img id="profilePicture" class="profilePicture" src="/lab1/public/images/user-icon.jpg"
                                alt="Profile picture">
                            <span class="username" id="username"><?= $username ?></span>
                        </button>
                        <div class="user-content">
                            <a href="#">Profile</a>
                            <a href="/lab1/index.php?url=auth/logout">Log out</a>
                        </div>
                    <?php else: ?>
                        <a href="/lab1/index.php?url=auth/login" class="login-btn">Login</a>
                    <?php endif; ?>
                </div>
            </div>
    </header>

    <main>
        <div class="navigation">
            <input type="checkbox" class="toggle" id="toggle-checkbox">
            <label for="toggle-checkbox" class="toggle-label"><i class="fa-solid fa-bars"></i></label>
    
            <nav class="navbar">
                <ul>
                    <li><a href="/lab1/index.php?url=dashboard/index">Dashboard</a></li>
                    <li><a href="/lab1/index.php?url=student/index">Students</a></li>
                    <li><a href="/lab1/index.php?url=tasks/index" class="active">Tasks</a></li>
                </ul>
            </nav>
        </div>

        <h1 class="main-heading1">
                Welcome to the Tasks,
                <?php echo isset($_SESSION['user']['firstname']) ? htmlspecialchars($_SESSION['user']['firstname']) . '!' : ''; ?>
            </h1>
    </main>

</div>
</body>
</html>


