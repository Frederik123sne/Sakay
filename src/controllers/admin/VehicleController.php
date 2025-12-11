<?php
require_once __DIR__ . '/../../models/Vehicle.php';

class VehicleController
{
    private $vehicleModel;
    private $message;
    private $messageType;

    public function __construct()
    {
        $this->vehicleModel = new Vehicle();
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
     * Handle POST actions
     */
    private function handlePostRequest()
    {
        $action = $_POST['action'] ?? '';

        switch ($action) {
            case 'add':
                $this->addVehicle();
                break;
            case 'edit':
                $this->editVehicle();
                break;
            case 'delete':
                $this->deleteVehicle();
                break;
            case 'update_status':
                $this->updateStatus();
                break;
            case 'export':
                $this->exportVehicles();
                break;
            default:
                $this->message = 'Invalid action';
                $this->messageType = 'error';
        }
    }

    /**
     * Add new vehicle
     */
    private function addVehicle()
    {
        $data = [
            'vehicleID' => $_POST['vehicleID'] ?? uniqid('V'),
            'driverID' => $_POST['driverID'] ?? '',
            'brand' => trim($_POST['brand'] ?? ''),
            'model' => trim($_POST['model'] ?? ''),
            'plate_number' => trim($_POST['plate_number'] ?? ''),
            'color' => trim($_POST['color'] ?? ''),
            'year' => trim($_POST['year'] ?? ''),
            'seats_available' => (int)($_POST['seats_available'] ?? 4),
            'OR_CR' => trim($_POST['OR_CR'] ?? '')
        ];

        if (empty($data['driverID']) || empty($data['plate_number'])) {
            $this->message = 'Driver and Plate Number are required';
            $this->messageType = 'error';
            return;
        }

        $result = $this->vehicleModel->addVehicle($data);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    /**
     * Edit vehicle
     */
    private function editVehicle()
    {
        $vehicleID = $_POST['vehicleID'] ?? '';

        if (empty($vehicleID)) {
            $this->message = 'Vehicle ID is missing';
            $this->messageType = 'error';
            return;
        }

        $data = [
            'vehicleID' => $vehicleID,
            'brand' => trim($_POST['brand'] ?? ''),
            'model' => trim($_POST['model'] ?? ''),
            'plate_number' => trim($_POST['plate_number'] ?? ''),
            'color' => trim($_POST['color'] ?? ''),
            'year' => trim($_POST['year'] ?? ''),
            'seats_available' => (int)($_POST['seats_available'] ?? 4),
            'OR_CR' => trim($_POST['OR_CR'] ?? '')
        ];

        $result = $this->vehicleModel->editVehicle($data);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    /**
     * Delete vehicle
     */
    private function deleteVehicle()
    {
        $vehicleID = $_POST['vehicleID'] ?? '';

        if (empty($vehicleID)) {
            $this->message = 'Vehicle ID is required';
            $this->messageType = 'error';
            return;
        }

        $result = $this->vehicleModel->deleteVehicle($vehicleID);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    /**
     * Update vehicle status
     */
    private function updateStatus()
    {
        $vehicleID = $_POST['vehicleID'] ?? '';
        $status = $_POST['status'] ?? '';

        if (empty($vehicleID) || empty($status)) {
            $this->message = 'Invalid request';
            $this->messageType = 'error';
            return;
        }

        $result = $this->vehicleModel->updateVehicleStatus($vehicleID, $status);
        $this->message = $result['message'];
        $this->messageType = $result['success'] ? 'success' : 'error';
    }

    /**
     * Export vehicle list to CSV
     */
    private function exportVehicles()
    {
        $filters = [
            'search' => $_POST['search'] ?? '',
            'status' => $_POST['status'] ?? '',
            'sort_by' => $_POST['sort_by'] ?? 'v.created_at',
            'sort_order' => $_POST['sort_order'] ?? 'DESC'
        ];

        $vehicles = $this->vehicleModel->getAllVehiclesForExport($filters);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=vehicle_list_' . date('Y-m-d') . '.csv');

        $output = fopen('php://output', 'w');
        fputcsv($output, [
            'Vehicle ID',
            'Driver Name',
            'Brand',
            'Model',
            'Plate Number',
            'Color',
            'Year',
            'Seats Available',
            'Status',
            'Verified By',
            'Verified At',
            'Created At'
        ]);

        foreach ($vehicles as $v) {
            fputcsv($output, [
                $v['vehicleID'],
                $v['driver_full_name'],
                $v['brand'],
                $v['model'],
                $v['plate_number'],
                $v['color'],
                $v['year'],
                $v['seats_available'],
                $v['vehicle_status'],
                $v['verified_by_name'] ?? '',
                $v['verified_at'] ?? '',
                $v['created_at']
            ]);
        }

        fclose($output);
        exit;
    }

    /**
     * Fetch vehicle list
     */
    public function getVehicles($filters = [])
    {
        return $this->vehicleModel->getVehicles($filters);
    }

    /**
     * Get vehicles that match any of the provided statuses
     */
    public function getVehiclesByStatuses($statuses = [], $filters = [])
    {
        return $this->vehicleModel->getVehiclesByStatuses($statuses, $filters);
    }

    public function getTotalVehicles($filters = [])
    {
        return $this->vehicleModel->getTotalVehicles($filters);
    }

    public function getVehicleDetails($vehicleID)
    {
        if (empty($vehicleID)) return null;
        return $this->vehicleModel->getVehicleDetails($vehicleID);
    }

    public function getItemsPerPage()
    {
        return $this->vehicleModel->getItemsPerPage();
    }

    public function getMessage() { return $this->message; }
    public function getMessageType() { return $this->messageType; }
    public function getVehicleStats()
{
    return $this->vehicleModel->getVehicleStats();
}

}
?>
