<?php
require_once __DIR__ . '/../../models/User.php';

class UserController
{
    private $userModel;
    private $message;
    private $messageType;

    public function __construct()
    {
        $this->userModel = new User();
        $this->message = '';
        $this->messageType = '';
    }

    /**
     * Handle incoming requests
     */
    public function handleRequest()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->handlePostRequest();
        }
    }

    /**
     * Handle POST requests
     */
    private function handlePostRequest()
    {
        $action = $_POST['action'] ?? '';

        switch ($action) {
            case 'add':
                $this->addUser();
                break;

            case 'edit':
                $this->editUser();
                break;

            case 'delete':
                $this->deleteUser();
                break;

            case 'update_status':
                $this->updateStatus();
                break;

            case 'export':
                $this->exportUsers();
                break;

            default:
                $this->message = 'Invalid action';
                $this->messageType = 'error';
        }
    }

    /**
     * Add new user
     */
    private function addUser()
    {
        $data = [
            'first_name' => trim($_POST['first_name'] ?? ''),
            'last_name' => trim($_POST['last_name'] ?? ''),
            'email' => trim($_POST['email'] ?? ''),
            'role' => strtolower($_POST['role'] ?? 'passenger')
        ];

        if (empty($data['first_name']) || empty($data['email'])) {
            $this->message = 'First name and email are required';
            $this->messageType = 'error';
            return;
        }

        $result = $this->userModel->addUser($data);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    /**
     * Edit existing user
     */
    private function editUser()
    {
        $userID = $_POST['userID'] ?? '';

        if (empty($userID)) {
            $this->message = 'No user selected';
            $this->messageType = 'error';
            return;
        }

        $data = [
            'userID' => $userID,
            'first_name' => trim($_POST['first_name'] ?? ''),
            'last_name' => trim($_POST['last_name'] ?? ''),
            'email' => trim($_POST['email'] ?? ''),
            'role' => strtolower($_POST['role'] ?? 'passenger')
        ];

        if (empty($data['first_name']) || empty($data['email'])) {
            $this->message = 'First name and email are required';
            $this->messageType = 'error';
            return;
        }

        $result = $this->userModel->editUser($data);
        $this->message = $result ? 'User updated successfully' : 'Failed to update user';
        $this->messageType = $result ? 'success' : 'error';
    }

    /**
     * Delete user
     */
    private function deleteUser()
    {
        $userID = $_POST['userID'] ?? '';

        if (empty($userID)) {
            $this->message = 'No user selected';
            $this->messageType = 'error';
            return;
        }

        $result = $this->userModel->deleteUser($userID);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    /**
     * Update user status
     */
    private function updateStatus()
    {
        $userID = $_POST['userID'] ?? '';
        $status = $_POST['status'] ?? '';

        if (empty($userID) || empty($status)) {
            $this->message = 'Invalid status update request';
            $this->messageType = 'error';
            return;
        }

        $result = $this->userModel->updateUserStatus($userID, $status);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    /**
     * Export users to CSV
     */
    private function exportUsers()
    {
        $filters = [
            'search' => $_POST['search'] ?? '',
            'role' => $_POST['role'] ?? '',
            'status' => $_POST['status'] ?? '',
            'sort_by' => $_POST['sort_by'] ?? 'created_at',
            'sort_order' => $_POST['sort_order'] ?? 'DESC'
        ];

        // Delegate to model
        $users = $this->userModel->getAllUsersForExport($filters);

        // Generate CSV headers
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=user_list_' . date('Y-m-d') . '.csv');

        $output = fopen('php://output', 'w');

        fputcsv($output, [
            'User ID',
            'First Name',
            'Last Name',
            'Email',
            'Role',
            'Status',
            'Date Created',
            'Verified By',
            'Verified At',
            'Last Login'
        ]);

        foreach ($users as $user) {
            fputcsv($output, [
                $user['userID'],
                $user['first_name'],
                $user['last_name'],
                $user['email'],
                $user['role'],
                $user['status'],
                $user['created_at'],
                $user['verified_by'] ?? '',
                $user['verified_at'] ?? '',
                $user['last_login'] ?? ''
            ]);
        }

        fclose($output);
        exit;
    }

    /**
     * Get all users with filters and pagination
     */
    public function getUsers($filters = [])
    {
        return $this->userModel->getUsers($filters);
    }

    /**
     * Get total users count
     */
    public function getTotalUsers($filters = [])
    {
        return $this->userModel->getTotalUsers($filters);
    }

    /**
     * Get user statistics
     */
    public function getUserStats()
    {
        return $this->userModel->getUserStats();
    }

    /**
     * Get aggregated user counts
     */
    public function getCounts()
    {
        return $this->userModel->getCounts();
    }

    /**
     * Get user growth data 
     */
    public function getGrowthData($months = 6)
    {
        return $this->userModel->getUserGrowth($months);
    }

    /**
     * Get user details by ID
     */
    public function getUserDetails($userID)
    {
        if (empty($userID)) {
            return null;
        }
        return $this->userModel->getUserDetails($userID);
    }

    /**
     * Get items per page
     */
    public function getItemsPerPage()
    {
        return $this->userModel->getItemsPerPage();
    }

    /**
     * Get message from last operation
     */
    public function getMessage()
    {
        return $this->message;
    }

    /**
     * Get message type (success/error)
     */
    public function getMessageType()
    {
        return $this->messageType;
    }
}