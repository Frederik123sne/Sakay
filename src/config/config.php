<?php
class Database {
    // Holds the single instance of the class
    private static $instance = null;

    // Holds the MySQLi connection object
    private $conn;

    // Database configuration details
    private $host = 'localhost';
    private $user = 'root';
    private $pass = '';
    private $db   = 'sakaybravo';

    
    // Private constructor prevents direct instantiation.
    // Initializes the MySQLi connection when first called.
    private function __construct() {
        // Create MySQLi connection
        $this->conn = new mysqli($this->host, $this->user, $this->pass, $this->db);

        // Check if connection failed
        if ($this->conn->connect_error) {
            // Stop execution and show error message
            die("Connection failed: " . $this->conn->connect_error);
        }

        // Set default character encoding for consistent data handling
        $this->conn->set_charset("utf8mb4");
    }

    /**
     * Get the single instance of this class.
     * Creates it if it doesn’t exist yet.
     *
     * @return Database
     */
    public static function getInstance() {
        if (!self::$instance) {
            self::$instance = new Database(); // First-time initialization
        }
        return self::$instance;
    }

    /**
     * Get the MySQLi connection object.
     *
     * @return mysqli
     */
    public function getConnection() {
        return $this->conn;
    }
}
?>
