<?php
require_once __DIR__ . '/../../models/Report.php';

class ReportController
{
    private $reportModel;
    private $message;
    private $messageType;

    public function __construct()
    {
        $this->reportModel = new Report();
        $this->message = '';
        $this->messageType = '';
    }

    public function handleRequest()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->handlePostRequest();
        }
    }

    private function handlePostRequest()
    {
        $action = $_POST['action'] ?? '';

        switch ($action) {
            case 'add':
                $this->addReport();
                break;
            case 'delete':
                $this->deleteReport();
                break;
            case 'update_status':
                $this->updateStatus();
                break;
            case 'export':
                $this->exportReports();
                break;
            default:
                $this->message = 'Invalid action';
                $this->messageType = 'error';
        }
    }

    private function addReport()
    {
        $data = [
            'userID' => $_POST['userID'] ?? '',
            'report_type' => $_POST['report_type'] ?? '',
            'description' => trim($_POST['description'] ?? '')
        ];

        if (empty($data['userID']) || empty($data['report_type']) || empty($data['description'])) {
            $this->message = 'All fields are required';
            $this->messageType = 'error';
            return;
        }

        $result = $this->reportModel->addReport($data);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    private function deleteReport()
    {
        $reportID = $_POST['reportID'] ?? '';

        if (empty($reportID)) {
            $this->message = 'No report selected';
            $this->messageType = 'error';
            return;
        }

        $result = $this->reportModel->deleteReport($reportID);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    private function updateStatus()
    {
        $reportID = $_POST['reportID'] ?? '';
        $status = $_POST['status'] ?? '';

        if (empty($reportID) || empty($status)) {
            $this->message = 'Invalid request';
            $this->messageType = 'error';
            return;
        }

        $result = $this->reportModel->updateReportStatus($reportID, $status);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    private function exportReports()
    {
        $filters = [
            'type' => $_POST['type'] ?? '',
            'role' => $_POST['role'] ?? '',
            'start_date' => $_POST['start_date'] ?? '',
            'end_date' => $_POST['end_date'] ?? '',
            'search' => $_POST['search'] ?? ''
        ];

        $reports = $this->reportModel->getReports($filters);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=reports_' . date('Y-m-d') . '.csv');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['Report ID', 'User Name', 'Email', 'Role', 'Type', 'Description', 'Status', 'Date Created']);

        foreach ($reports as $r) {
            fputcsv($output, [
                $r['reportID'],
                $r['first_name'] . ' ' . $r['last_name'],
                $r['email'],
                $r['role'],
                $r['report_type'],
                $r['description'],
                $r['status'],
                $r['created_at']
            ]);
        }

        fclose($output);
        exit;
    }

    public function getReports($filters = [])
    {
        return $this->reportModel->getReports($filters);
    }

    public function getTotalReports($filters = [])
    {
        return $this->reportModel->getTotalReports($filters);
    }

    public function getReportStats()
    {
        return $this->reportModel->getReportStats();
    }

    public function getItemsPerPage()
    {
        return $this->reportModel->getItemsPerPage();
    }

    public function getMessage()
    {
        return $this->message;
    }

    public function getMessageType()
    {
        return $this->messageType;
    }
}
?>
