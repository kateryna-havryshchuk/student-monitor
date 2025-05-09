<?php
require_once __DIR__ . "/../core/Database.php";

class Student
{
    private $db;

    //Ініціалізує підключення до бази даних, створюючи об'єкт класу Database
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->pdo; //зберігає PDO-об'єкт у приватну властивість $db
    }

    /**
     * Get all students
     */
    public function getAllStudents()
    {
        try {
            $query = "SELECT id, student_group, firstname, lastname, gender, birthday 
                      FROM students 
                      ORDER BY id DESC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return array_map(function ($student) {
                $student['firstname'] = ucfirst(strtolower($student['firstname']));
                $student['lastname'] = ucfirst(strtolower($student['lastname']));
                return $student;
            }, $stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            error_log("Error in getAllStudents: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get a specific student by ID
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
     * Check if a student with the same first name, last name, and birthday exists
     */
    public function checkDuplicateStudent($firstName, $lastName, $birthday)
    {
        try {
            $query = "SELECT COUNT(*) 
                      FROM students 
                      WHERE firstname = :firstname 
                      AND lastname = :lastname 
                      AND birthday = :birthday";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':firstname', $firstName, PDO::PARAM_STR);
            $stmt->bindParam(':lastname', $lastName, PDO::PARAM_STR);
            $stmt->bindParam(':birthday', $birthday, PDO::PARAM_STR);
            $stmt->execute();
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Error in checkDuplicateStudent: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Add a new student
     */
    public function addStudent($group, $firstName, $lastName, $gender, $birthday)
    {
        try {
            // // Normalize first and last names
            $firstName = ucfirst(strtolower($firstName));
            $lastName = ucfirst(strtolower($lastName));

            // Check for duplicate student
            if ($this->checkDuplicateStudent($firstName, $lastName, $birthday)) {
                return false; // Duplicate found
            }

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
     */
    public function getLastInsertId()
    {
        return $this->db->lastInsertId();
    }
}