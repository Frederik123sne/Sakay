<?php
// Load the database configuration file
require_once __DIR__ . '/config/config.php';

class ContactForm {
    private $conn;  // Property to store the database connection

    public function __construct() {
        // Get a database connection instance when the class is created
        $this->conn = Database::getInstance()->getConnection();
    }

    // Function to generate a unique message ID like MSG001, MSG002, etc.
    private function generateMessageID() {
        $prefix = "MSG"; // ID prefix

        // Get the latest messageID based on most recent created_at entry
        $query = "SELECT messageID FROM contact_us ORDER BY created_at DESC LIMIT 1";
        $result = $this->conn->query($query);

        // If a result exists, extract the last number and increment it
        if ($result && $row = $result->fetch_assoc()) {
            // Remove "MSG" and convert the numeric part to integer
            $lastNum = intval(substr($row['messageID'], 3));
            $newNum = $lastNum + 1;
        } else {
            // If no previous messages exist, start at 1
            $newNum = 1;
        }

        // Return the new ID with leading zeros: MSG001
        return $prefix . str_pad($newNum, 3, "0", STR_PAD_LEFT);
    }

    // Main function to store the message into the database
    public function sendMessage($name, $email, $message) {
        // Validate required form fields
        if (empty($name) || empty($email) || empty($message)) {
            return "All fields are required.";
        }
        // Generate a unique message ID
        $messageID = $this->generateMessageID();
        $status = 'new'; // Default status for new messages
        // Prepare an SQL insert statement (prevents SQL injection)
        $stmt = $this->conn->prepare("
            INSERT INTO contact_us (messageID, name, email, message, status)
            VALUES (?, ?, ?, ?, ?)
        ");
        // Bind parameters to the prepared statement
        $stmt->bind_param("sssss", $messageID, $name, $email, $message, $status);
        // Execute and return a message based on success/failure
        if ($stmt->execute()) {
            return "Your message has been sent! Thank you.";
        } else {
            return "Database error: " . $stmt->error;
        }
    }
}

// Handle POST Request when the user submits the form ---
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Create an instance of the ContactForm class
    $form = new ContactForm();

    // Safely get input values or set empty string if not present
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $message = $_POST['message'] ?? '';

    // Output the result of sending the message
    echo $form->sendMessage($name, $email, $message);
}
?>
    