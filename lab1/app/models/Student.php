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
     * Delete multiple students
     * 
     * @param array $ids Array of student IDs
     * @return bool Success status
     * @throws PDOException If database query fails
     */
    public function deleteMultipleStudents($ids)
    {
        if (empty($ids)) {
            return false;
        }

        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $query = "DELETE FROM students WHERE id IN ($placeholders)";
            $stmt = $this->db->prepare($query);

            // Bind each ID as parameter
            foreach ($ids as $index => $id) {
                $stmt->bindValue($index + 1, $id, PDO::PARAM_INT);
            }

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error in deleteMultipleStudents: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get paginated students
     * 
     * @param int $page Current page number
     * @param int $perPage Number of records per page
     * @return array List of students for current page
     * @throws PDOException If database query fails
     */
    public function getPaginatedStudents($page = 1, $perPage = 6)
    {
        try {
            $offset = ($page - 1) * $perPage;
            $query = "SELECT id, student_group, firstname, lastname, gender, birthday 
                  FROM students 
                  ORDER BY id DESC
                  LIMIT :limit OFFSET :offset";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getPaginatedStudents: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get total count of students
     * 
     * @return int Total number of students
     * @throws PDOException If database query fails
     */
    public function getTotalStudentsCount()
    {
        try {
            $query = "SELECT COUNT(*) FROM students";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error in getTotalStudentsCount: " . $e->getMessage());
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