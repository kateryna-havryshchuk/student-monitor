<?php
class User {
    private $db;

    public function __construct() {
        $this->db = (new Database())->pdo;
    }

    public function create($data) {
        $sql = "INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$data['firstname'],$data['lastname'], $data['email'], $data['password']]);
    }

    public function findByEmail($email) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
