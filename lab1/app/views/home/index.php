<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../../core/Database.php';

try {
    $database = new Database();
    $conn = $database->pdo;

    $query = "SELECT id, student_group, firstname, lastname, gender, birthday FROM students";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $loggedIn = isset($_SESSION['user']);
    $username = $loggedIn ? htmlspecialchars($_SESSION['user']['firstname'] . ' ' . $_SESSION['user']['lastname']) : null;
} catch (PDOException $e) {
    $error = "Database error: " . $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Students</title>
    <link rel="icon" href="public/images/favicon-96x96.png" type="image/png">
    <link rel="stylesheet" href="/lab1/public/style.css">
    <script src="https://kit.fontawesome.com/d9209b8d96.js" crossorigin="anonymous"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js"></script>
    <script type="module" src="/lab1/public/index.js"></script>
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
                        <img id="profilePicture" class="profilePicture" src="/lab1/public/images/user-icon.jpg" alt="Profile picture">
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
            <input type="checkbox" class="toggle" id="toggle-checkbox" title="Check to toggle menu">
            <label id="toggle-label" for="toggle-checkbox" class="toggle-label">
                <span>Toggle menu</span>
                <i class="fa-solid fa-bars"></i>
            </label>
            <nav class="navbar">
                <ul>
                <?php if ($loggedIn): ?>
                            <li><a href="/lab1/index.php?url=dashboard/index">Dashboard</a></li>
                    <?php else: ?>
                            <li><a href="/lab1/index.php?url=auth/login">Dashboard</a></li>
                    <?php endif; ?>
                    <li><a href="/lab1/index.php?url=student/index" class="active">Students</a></li>
                    <?php if ($loggedIn): ?>
                            <li><a href="/lab1/index.php?url=tasks/index">Tasks</a></li>
                    <?php else: ?>
                            <li><a href="/lab1/index.php?url=auth/login">Tasks</a></li>
                    <?php endif; ?>
                </ul>
            </nav>
        </div>

        <h1 class="main-heading1">
                Welcome, <?php echo isset($_SESSION['user']['firstname']) ? htmlspecialchars($_SESSION['user']['firstname']) : 'Guest'; ?>!
        </h1>

        <?php if ($loggedIn): ?>
            <div class="button-container">
                <button type="button" aria-label="addBtn" class="addBtn" id="addBtn">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        <?php endif; ?>

        <div class="table-container">
            <table id="studentsTable">
                <thead id="tableHead">
                    <tr>
                        <th>
                            <input label="checkbox" type="checkbox" id="selectAll">
                            <label for="selectAll" class="visually-hidden">Select all</label>
                        </th>
                        <th>Group</th>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Birthday</th>
                        <th>Status</th>
                        <th>Options</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <?php if (!empty($students)): ?>
                        <?php foreach ($students as $row): ?>
                            <?php
                            $fullName = htmlspecialchars($row['firstname'] . ' ' . $row['lastname']);
                            $formattedDate = date('d.m.Y', strtotime($row['birthday']));
                            ?>
                            <tr class="tableRow">
                                <th>
                                    <input type="checkbox" id="select<?= $row['id'] ?>" data-id="<?= $row['id'] ?>">
                                    <label for="select<?= $row['id'] ?>" class="visually-hidden">Select one</label>
                                </th>
                                <td><?= htmlspecialchars($row['student_group']) ?></td>
                                <td><?= $fullName ?></td>
                                <td><?= htmlspecialchars($row['gender']) ?></td>
                                <td><?= $formattedDate ?></td>
                                <td><span class="inactive-dot"></span></td>
                                <td>
                                    <?php if ($loggedIn): ?>
                                        <button class="editRowBtn" data-id="<?= $row['id'] ?>">
                                            <i class="fa-solid fa-pencil"></i>
                                        </button>
                                        <button class="deleteRowBtn" data-id="<?= $row['id'] ?>" data-name="<?= $fullName ?>">
                                            <i class="fa-solid fa-xmark fa-lg"></i>
                                        </button>
                                    <?php else: ?>
                                        <span class="no-access">N/A</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="7" class="no-data">No students found</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </main>
</div>

<!-- Add/Edit Modal -->
<div id="addEditModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Add student</h2>
            <span class="close-btn" id="closeModalBtn">×</span>
        </div>
        <div class="modal-body">
            <form id="studentForm">
                <input type="hidden" id="studentId" name="id">
                <div class="form-group">
                    <label for="group">Group</label>
                    <select id="group" name="group" required>
                        <option value="">Select Group</option>
                        <option value="PZ-21">PZ-21</option>
                        <option value="PZ-22">PZ-22</option>
                        <option value="PZ-23">PZ-23</option>
                        <option value="PZ-24">PZ-24</option>
                        <option value="PZ-25">PZ-25</option>
                        <option value="PZ-26">PZ-26</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="firstName">First name</label>
                    <input type="text" id="firstName" name="firstName" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Last name</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>
                <div class="form-group">
                    <label for="gender">Gender</label>
                    <select id="gender" name="gender" required>
                        <option value="">Select Gender</option>
                        <option value="M">M</option>
                        <option value="F">F</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="birthday">Birthday</label>
                    <input type="date" id="birthday" name="birthday" required>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="submit" class="okBtn" id="okBtn">OK</button>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="deleteModal" class="modal">
    <div class="modal-content delete-warning">
        <div class="modal-header">
            <h2>Warning</h2>
            <span class="close-btn">×</span>
        </div>
        <div class="modal-body">
            <p id="deleteConfirmText">Are you sure you want to delete user <span id="studentName"></span>?</p>
        </div>
        <div class="modal-footer">
            <button class="newOkBtn" id="newOkBtn">OK</button>
            <button class="cancelDeleteBtn" id="cancelDeleteBtn">Cancel</button>
        </div>
    </div>
</div>
</body>
</html>