<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$loggedIn = isset($_SESSION['user']);
$username = $loggedIn ? ucfirst(strtolower($_SESSION['user']['firstname'])) . ' ' . ucfirst(strtolower($_SESSION['user']['lastname'])) : null;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Messages</title>
    <link rel="icon" href="public/images/favicon-96x96.png" type="image/png">
    <link rel="stylesheet" href="/lab1/public/messageStyle.css">
    <script type="module" src="/lab1/public/messagesFunctional.js"></script>
    <script src="https://kit.fontawesome.com/d9209b8d96.js" crossorigin="anonymous"></script>
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
                    <button id="notificationBtn">
                        <i class="fa-regular fa-bell fa-xl" id="bellIcon"></i>
                    </button>
                    <div class="notify-content">
                        <a href="#">No new notifications</a>
                    </div>
                </div>
        
                <div class="user-dropdown">
                    <button id="userBtn">
                        <img id="profilePicture" src="/lab1/public/images/user-icon.jpg" alt="Profile picture">
                        <span class="username" id="username"><?= htmlspecialchars($username) ?></span>
                    </button>
                    <div class="user-content">
                        <a href="#">Profile</a>
                        <a href="/lab1/index.php?url=auth/logout">Log out</a>
                    </div>
                </div>
            <?php else: ?>
                <a href="/lab1/index.php?url=auth/login" class="login-btn">Login</a>
            <?php endif; ?>
        </div>
    </header>
    
    <main>
        <div class="navigation">
            <input type="checkbox" class="toggle" id="toggle-checkbox">
            <label for="toggle-checkbox" class="toggle-label"><i class="fa-solid fa-bars"></i></label>
    
            <nav class="navbar">
                <ul>
                    <?php if ($loggedIn): ?>
                        <li><a href="/lab1/index.php?url=dashboard/index">Dashboard</a></li>
                    <?php else: ?>
                        <li><a href="/lab1/index.php?url=auth/login">Dashboard</a></li>
                    <?php endif; ?>
                    <li><a href="/lab1/index.php?url=student/index">Students</a></li>
                    <?php if ($loggedIn): ?>
                        <li><a href="/lab1/index.php?url=tasks/index">Tasks</a></li>
                    <?php else: ?>
                        <li><a href="/lab1/index.php?url=auth/login">Tasks</a></li>
                    <?php endif; ?>
                    <li><a href="/lab1/index.php?url=messages/index" class="active">Messages</a></li>
                </ul>
            </nav>
        </div>
        
        <div class="table-container chat-container">
            <div class="chat-sidebar">
                <div class="chat-header">
                    <h3>Chat room</h3>
                    <?php if ($loggedIn): ?>
                        <button class="new-chat-btn" id="addBtn">
                            <i class="fa-solid fa-plus">New chat</i>
                        </button>
                    <?php endif; ?>
                </div>
                
                <ul class="chat-list">
                    <li class="chat-item active">
                        <div class="chat-item-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="chat-item-info">
                            <div class="chat-item-name">Admin</div>
                        </div>
                    </li>
                    <li class="chat-item">
                        <div class="chat-item-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="chat-item-info">
                            <div class="chat-item-name">Victor</div>
                            <span>How are you?</span>
                        </div>
                    </li>
                    <li class="chat-item">
                        <div class="chat-item-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="chat-item-info">
                            <div class="chat-item-name">Jess</div>
                            <span>See you then!</span>
                        </div>
                    </li>
                    <li class="chat-item">
                        <div class="chat-item-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="chat-item-info">
                            <div class="chat-item-name">Max</div>
                            <span id="leftUnderMessage">What's up!</span>
                        </div>
                    </li>
                </ul>
            </div>
            
            <!-- Chat main area -->
            <div class="chat-main">
                <div class="chat-header">
                    <h3 class="chat-title">Chat room Admin</h3>
                </div>
                
                <div class="chat-members">
                    <div class="members-title">Members</div>
                    <div class="members-list">
                        <div class="member-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="member-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="member-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <?php if ($loggedIn): ?>
                            <div class="add-member">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="chat-messages">
                    <div class="message message-received">
                        <div class="message-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="message-bubble">
                            <div class="message-sender">Admin</div>
                            <div class="message-content">Hello everyone! Welcome to our new chat room.</div>
                            <div class="message-time">10:30 AM</div>
                        </div>
                    </div>
                    
                    <div class="message message-sent">
                        <div class="message-bubble">
                            <div class="message-sender">Me</div>
                            <div class="message-content">Thank you for the invitation!</div>
                            <div class="message-time">10:32 AM</div>
                        </div>
                        <div class="message-avatar">
                            <img src="/lab1/public/images/user-icon.jpg" alt="Me">
                        </div>
                    </div>
                </div>

                <?php if ($loggedIn): ?>
                    <div class="chat-input">
                        <input type="text" placeholder="Type your message...">
                        <button>
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </main>
</div>
</body>
</html>