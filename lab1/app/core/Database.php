<?php
class Database
{
    private $servername = 'localhost';
    private $dbname = 'studentsdb';
    private $username = 'root';
    private $password = '';
    public $pdo;

    public function __construct()
    {
        try {
            $this->pdo = new PDO(
                "mysql:host=$this->servername;dbname=$this->dbname;charset=utf8",
                $this->username,
                $this->password
            );
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Помилка підключення до БД: ' . $e->getMessage()]);
            exit;
        }
    }
}