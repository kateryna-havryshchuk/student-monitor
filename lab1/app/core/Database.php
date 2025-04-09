<?php

class Database
{
    private $host = 'localhost';
    private $dbname = 'studentsdb';
    private $username = 'root';
    private $password = '';
    public $pdo;

    public function __construct()
    {
        try {
            $this->pdo = new PDO(
                "mysql:host=$this->host;dbname=$this->dbname;charset=utf8",
                $this->username,
                $this->password
            );
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // echo "Підключення успішне!";
        } catch (PDOException $e) {
            die("Помилка підключення до БД: " . $e->getMessage());
        }
    }
}
