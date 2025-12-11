<?php
header('Content-Type: application/json; charset=utf-8');

date_default_timezone_set('Asia/Manila');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'user_counts':
        require_once __DIR__ . '/../../src/controllers/admin/UserController.php';
        try {
            $controller = new UserController();
            $counts = $controller->getCounts();
            if (!is_array($counts)) throw new Exception('Invalid data from controller');
            echo json_encode(array_merge(['success' => true], $counts));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
    case 'user_growth':
        require_once __DIR__ . '/../../src/controllers/admin/UserController.php';
        try {
            $months = isset($_GET['months']) ? (int)$_GET['months'] : 6;
            $controller = new UserController();
            $data = $controller->getGrowthData($months);
            if (!is_array($data) || !isset($data['labels']) || !isset($data['counts'])) throw new Exception('Invalid data from controller');
            $out = ['success' => true, 'labels' => $data['labels'], 'counts' => $data['counts']];
            if (isset($data['keys'])) $out['keys'] = $data['keys'];
            echo json_encode($out);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
    case 'ride_activity':
        require_once __DIR__ . '/../../src/controllers/admin/RideController.php';
        try {
            $controller = new RideController();
            $data = $controller->getActivity();
            if (is_array($data) && isset($data['labels']) && isset($data['counts'])) {
                echo json_encode(['success' => true, 'labels' => $data['labels'], 'counts' => $data['counts'], 'keys' => $data['keys'] ?? []]);
                exit;
            }
            echo json_encode(['success' => false, 'message' => 'Invalid data from model']);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
    case 'vehicles':
        require_once __DIR__ . '/../../src/controllers/admin/VehicleController.php';
        $controller = new VehicleController();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action2 = $_POST['action'] ?? '';
            if ($action2 === 'update_status') {
                $controller->handleRequest();
                $type = $controller->getMessageType();
                $msg = $controller->getMessage();
                echo json_encode([
                    'success' => $type === 'success',
                    'message' => $msg
                ]);
                exit;
            }
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            exit;
        }
        $status = $_GET['status'] ?? '';
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $search = $_GET['search'] ?? '';
        $filters = [
            'page' => $page,
            'search' => $search,
        ];
        if (strtolower($status) === 'pending') {
            $statuses = ['for_renewal', 'renewed', 'expired'];
            $vehicles = $controller->getVehiclesByStatuses($statuses, ['page' => $page]);
        } else {
            if (!empty($status)) $filters['status'] = $status;
            $vehicles = $controller->getVehicles($filters);
        }
        echo json_encode(['success' => true, 'vehicles' => $vehicles]);
        break;
    case 'recent_reports':
        require_once __DIR__ . '/../../src/controllers/admin/ReportController.php';
        $controller = new ReportController();
        $today = date('Y-m-d');
        $filters = [
            'start_date' => $today,
            'end_date' => $today,
            'sort_by' => 'r.created_at',
            'sort_order' => 'DESC',
            'page' => 1
        ];
        $reports = $controller->getReports($filters);
        $data = array_map(function ($r) {
            return [
                'report_type' => $r['report_type'],
                'subject' => $r['subject'],
                'created_at' => $r['created_at']
            ];
        }, $reports);
        echo json_encode([
            'success' => true,
            'reports' => $data
        ]);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid or missing action']);
        break;
}
