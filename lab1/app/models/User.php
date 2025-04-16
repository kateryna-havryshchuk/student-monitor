<?php
require_once __DIR__ . '/../core/Database.php';

class User
{
    private $db;
    
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->pdo;
    }
    
    public function findByEmail($email)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Database error in findByEmail: ' . $e->getMessage());
            return false;
        }
    }
    
    public function create($userData)
    {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO users (firstname, lastname, email, password) 
                 VALUES (:firstname, :lastname, :email, :password)"
            );
            
            $stmt->bindParam(':firstname', $userData['firstname'], PDO::PARAM_STR);
            $stmt->bindParam(':lastname', $userData['lastname'], PDO::PARAM_STR);
            $stmt->bindParam(':email', $userData['email'], PDO::PARAM_STR);
            $stmt->bindParam(':password', $userData['password'], PDO::PARAM_STR);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Database error in create: ' . $e->getMessage());
            return false;
        }
    }
    
    public function findById($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Database error in findById: ' . $e->getMessage());
            return false;
        }
    }
    
}