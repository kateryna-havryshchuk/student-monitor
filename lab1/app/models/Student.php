<?php
require_once __DIR__ . "/../core/Database.php";

class Student
{
    private $db;
    
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->pdo;
    }
    
    /**
     * Get all students
     * 
     * @return array List of students
     * @throws PDOException If database query fails
     */
    public function getAllStudents()
    {
        try {
            $query = "SELECT id, student_group, firstname, lastname, gender, birthday 
                      FROM students 
                      ORDER BY id DESC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getAllStudents: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get a specific student by ID
     * 
     * @param int $id Student ID
     * @return array|false Student data or false if not found
     * @throws PDOException If database query fails
     */
    public function getStudentById($id)
    {
        try {
            $query = "SELECT id, student_group, firstname, lastname, gender, birthday 
                      FROM students 
                      WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getStudentById: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Add a new student
     * 
     * @param string $group Student's group
     * @param string $firstName Student's first name
     * @param string $lastName Student's last name
     * @param string $gender Student's gender
     * @param string $birthday Student's birthday
     * @return bool Success status
     * @throws PDOException If database query fails
     */
    public function addStudent($group, $firstName, $lastName, $gender, $birthday)
    {
        try {
            $query = "INSERT INTO students (student_group, firstname, lastname, gender, birthday) 
                      VALUES (:group, :firstname, :lastname, :gender, :birthday)";
            $stmt = $this->db->prepare($query);
            
            return $stmt->execute([
                ':group' => $group,
                ':firstname' => $firstName,
                ':lastname' => $lastName,
                ':gender' => $gender,
                ':birthday' => $birthday
            ]);
        } catch (PDOException $e) {
            error_log("Error in addStudent: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update an existing student
     * 
     * @param int $id Student ID
     * @param string $group Student's group
     * @param string $firstName Student's first name
     * @param string $lastName Student's last name
     * @param string $gender Student's gender
     * @param string $birthday Student's birthday
     * @return bool Success status
     * @throws PDOException If database query fails
     */
    public function updateStudent($id, $group, $firstName, $lastName, $gender, $birthday)
    {
        try {
            $query = "UPDATE students 
                      SET student_group = :group, 
                          firstname = :firstname, 
                          lastname = :lastname, 
                          gender = :gender, 
                          birthday = :birthday 
                      WHERE id = :id";
            $stmt = $this->db->prepare($query);
            
            return $stmt->execute([
                ':id' => $id,
                ':group' => $group,
                ':firstname' => $firstName,
                ':lastname' => $lastName,
                ':gender' => $gender,
                ':birthday' => $birthday
            ]);
        } catch (PDOException $e) {
            error_log("Error in updateStudent: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Delete a student
     * 
     * @param int $id Student ID
     * @return bool Success status
     * @throws PDOException If database query fails
     */
    public function deleteStudent($id)
    {
        try {
            $query = "DELETE FROM students WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error in deleteStudent: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get the ID of the last inserted student
     * 
     * @return int Last inserted ID
     */
    public function getLastInsertId()
    {
        return $this->db->lastInsertId();
    }
}