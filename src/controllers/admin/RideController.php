<?php
require_once __DIR__ . '/../../models/Ride.php';

class RideController
{
    private $model;

    public function __construct()
    {
        $this->model = new Ride();
    }

    /**
     * Get filtered active rides based on search and status
     */
    public function getActiveRides()
    {
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';

        return $this->model->getActiveRides($search, $status);
    }

    /**
     * Get ride statistics for dashboard cards
     */
    public function getRideStats()
    {
        return $this->model->getRideStats();
    }

    /**
     * Get ride activity data for charting (last 7 days)
     * @return array ['labels' => [...], 'counts' => [...], 'keys' => [...]]
     */
    public function getActivity()
    {
        return $this->model->getActivityLast7Days();
    }

    /**
     * Handle CSV export
     */
    public function exportCSV()
    {
        $rides = $this->model->getActiveRides();

        // Set headers for CSV download
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="active_rides_' . date('Y-m-d_H-i-s') . '.csv"');

        $output = fopen('php://output', 'w');

        // CSV headers
        fputcsv($output, [
            'Ride ID',
            'Driver',
            'Pickup',
            'Departure Time',
            'Destination',
            'Available Seats',
            'Total Seats',
            'Status',
            'ETA'
        ]);

        // CSV data
        foreach ($rides as $ride) {
            fputcsv($output, [
                $ride['rideID'],
                $ride['driver'],
                $ride['origin'],
                date('h:i A', strtotime($ride['departure_time'])),
                $ride['destination'],
                $ride['seats_available'],
                $ride['total_seats'],
                ucwords(str_replace('_', ' ', $ride['status'])),
                $ride['estimated_arrival'] ? date('h:i A', strtotime($ride['estimated_arrival'])) : '-'
            ]);
        }

        fclose($output);
        exit;
    }

    /**
     * Handle actions from URL parameters
     */
    public function handleAction()
    {
        $action = $_GET['action'] ?? $_POST['action'] ?? '';

        switch ($action) {
            case 'export':
                $this->exportCSV();
                break;
            default:
                // No action or unknown action
                break;
        }
    }
}

// Handle direct controller access for actions like CSV export
if (basename($_SERVER['PHP_SELF']) === 'RideController.php') {
    $controller = new RideController();
    $controller->handleAction();
}
