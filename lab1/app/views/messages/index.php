<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$loggedIn = isset($_SESSION['user']);
$username = $loggedIn ? ucfirst(strtolower($_SESSION['user']['firstname'])) . ' ' . ucfirst(strtolower($_SESSION['user']['lastname'])) : null;
// Use the chat_user_id if available, otherwise fallback to the user's primary ID
$currentUserIdForChat = $loggedIn ? ($_SESSION['user']['chat_user_id'] ?? $_SESSION['user']['id']) : null; 
$currentUserEmail = $loggedIn ? $_SESSION['user']['email'] : null;
$currentUserFirstname = $loggedIn ? $_SESSION['user']['firstname'] : null;
$currentUserLastname = $loggedIn ? $_SESSION['user']['lastname'] : null;

if (!$loggedIn) {
    header('Location: /lab1/index.php?url=auth/login');
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Messages</title>
    <link rel="icon" href="/lab1/public/images/favicon-96x96.png" type="image/png">
    <link rel="stylesheet" href="/lab1/public/messageStyle.css">
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <script src="https://kit.fontawesome.com/d9209b8d96.js" crossorigin="anonymous"></script>
</head>
<body>
<div id="wrapper">
    <header>
        <div class="logo">
            <div class="cms-link" id="cms-logo">
                <h4 class="cms" id="cms">CMS</h4>
            </div>
        </div>
        <div class="dropdown-container">
            <div class="notify-dropdown">
                <button class="notificationBtn" id="notificationBtn" aria-label="notificationBtn">
                    <i class="fa-regular fa-bell fa-xl" id="bellIcon"></i>
                    <span class="icon-button-badge"></span>
                </button>
                <div class="notify-content">
                    </div>
            </div>

            <div class="user-dropdown">
                <button class="userBtn" id="userBtn">
                    <img id="profilePicture" class="profilePicture" src="/lab1/public/images/user-icon.jpg" alt="Profile picture">
                    <span class="username" id="username"><?= htmlspecialchars($username) ?></span>
                </button>
                <div class="user-content">
                    <a href="#">Profile</a>
                    <a href="/lab1/index.php?url=auth/logout">Log out</a>
                </div>
            </div>
        </div>
    </header>

    <main>
        <div class="navigation">
            <input type="checkbox" class="toggle" id="toggle-checkbox" title="Check to toggle menu">
            <label id="toggle-label" for="toggle-checkbox" class="toggle-label">
                <span>Toggle menu</span>
                <i class="fa-solid fa-bars"></i>
            </label>
            <nav class="navbar">
                <ul>
                    <li><a href="/lab1/index.php?url=dashboard/index">Dashboard</a></li>
                    <li><a href="/lab1/index.php?url=student/index">Students</a></li>
                    <li><a href="/lab1/index.php?url=tasks/index">Tasks</a></li>
                    <li><a href="/lab1/index.php?url=messages/index" class="active">Messages</a></li>
                </ul>
            </nav>
        </div>

        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-header">
                    <h3>Chat Room</h3>
                    <div class="chat-actions">
                        <button class="new-chat-btn" id="initiateNewChatBtn">
                            <i class="fa-solid fa-plus"></i>
                            New chat
                        </button>
                    </div>
                </div>
                <ul class="chat-list" id="chatList">
                    </ul>
            </div>

            <div class="chat-main">
                <div class="chat-header" id="chatMainHeader">
                     <h3 class="chat-title" id="chatTitle">Select a chat</h3>
                     </div>
                <div class="chat-messages" id="chatMessages">
                    </div>
                <div class="chat-input" id="chatInputContainer" style="display: none;">
                    <textarea id="messageInput" placeholder="Type your message..."></textarea>
                    <button id="sendMessageBtn">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    </main>
</div>

<div id="studentSelectModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Select a Student</h2> <span class="close-btn" id="closeStudentModal">&times;</span>
        </div>
        <div class="modal-body">
            <input type="text" id="studentSearchInputModal" class="student-search" placeholder="Search students...">
            <input type="text" id="groupNameInputModal" class="student-search" placeholder="Enter group name (for 2+ users)" style="display:none; margin-top:10px;">
            <ul id="studentsListForModal" class="students-list">
                </ul>
        </div>
        <div class="modal-footer" style="padding-top: 10px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;">
            <button id="confirmStudentSelectionBtnModal" class="okBtn">Confirm</button>
        </div>
    </div>
</div>

<script>
    window.chatAppData = {
        currentUserId: <?= json_encode($currentUserIdForChat, JSON_NUMERIC_CHECK) ?>,
        currentUserEmail: <?= json_encode($currentUserEmail) ?>,
        currentUserFirstname: <?= json_encode($currentUserFirstname) ?>,
        currentUserLastname: <?= json_encode($currentUserLastname) ?>
    };
</script>
<script src="/lab1/public/chatClient.js"></script>
<script src="/lab1/public/messagesFunctional.js"></script>
</body>
</html>