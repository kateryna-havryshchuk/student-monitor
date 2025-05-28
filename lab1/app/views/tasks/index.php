<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$loggedIn = isset($_SESSION['user']);
$username = $loggedIn ? ucfirst(strtolower($_SESSION['user']['firstname'])) . ' ' . ucfirst(strtolower($_SESSION['user']['lastname'])) : null;
// --- ДОДАЙТЕ ЦІ РЯДКИ (ЯКЩО ЇХ ЩЕ НЕМАЄ) ---
$currentUserIdForChat = $loggedIn ? ($_SESSION['user']['chat_user_id'] ?? $_SESSION['user']['id']) : null;
$currentUserEmail = $loggedIn ? $_SESSION['user']['email'] : null;
$currentUserFirstname = $loggedIn ? $_SESSION['user']['firstname'] : null;
$currentUserLastname = $loggedIn ? $_SESSION['user']['lastname'] : null;
// --- КІНЕЦЬ ДОДАНИХ РЯДКІВ ---
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tasks</title>
    <link rel="icon" href="/lab1/public/images/favicon-96x96.png" type="image/png">
    <link rel="stylesheet" href="/lab1/public/messageStyle.css">
    <link rel="stylesheet" href="/lab1/public/style.css">
    <script src="https://kit.fontawesome.com/d9209b8d96.js" crossorigin="anonymous"></script>
    <!-- ДОДАЙТЕ SOCKET.IO -->
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
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
                            <!-- Прибрано клас bell-ringing -->
                            <i class="fa-regular fa-bell fa-xl" id="bellIcon"></i>
                            <!-- Прибрано клас show, можливо додати ID для зручності -->
                            <span class="icon-button-badge" id="notificationBadge"></span>
                        </button>
                        <div class="notify-content">
                          
                        </div>
                    </div>

                    <div class="user-dropdown">
                        <button class="userBtn" id="userBtn">
                            <img id="profilePicture" class="profilePicture" src="/lab1/public/images/user-icon.jpg"
                                alt="Profile picture">
                            <span class="username" id="username"><?= htmlspecialchars($username ?? 'User') ?></span>
                        </button>
                        <div class="user-content">
                            <a href="#">Profile</a>
                            <a href="/lab1/index.php?url=auth/logout">Log out</a>
                        </div>
                    </div> <!-- Закриваючий тег для user-dropdown -->
                <?php else: ?>
                    <a href="/lab1/index.php?url=auth/login" class="login-btn">Login</a>
                <?php endif; ?>
            </div> <!-- Закриваючий тег для dropdown-container -->
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
                <?php echo isset($_SESSION['user']['firstname']) ? ucfirst(strtolower(htmlspecialchars($_SESSION['user']['firstname']))) : 'Guest'; ?>!
            </h1>
        </main>

    </div>

    <!-- ДОДАЙТЕ СКРИПТИ ДЛЯ CHAT APP DATA ТА CHATCLIENT.JS -->
    <?php if($loggedIn): ?>
    <script>
        window.chatAppData = {
            currentUserId: <?= json_encode($currentUserIdForChat, JSON_NUMERIC_CHECK) ?>,
            currentUserEmail: <?= json_encode($currentUserEmail) ?>,
            currentUserFirstname: <?= json_encode($currentUserFirstname) ?>,
            currentUserLastname: <?= json_encode($currentUserLastname) ?>
        };
    </script>
    <script src="/lab1/public/chatClient.js"></script>
    <?php endif; ?>
</body>
</html>