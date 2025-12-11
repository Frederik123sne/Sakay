<?php
require_once __DIR__ . '/../../models/Payment.php';

class TransactionController {
    private $paymentModel;

    public function __construct() {
        $this->paymentModel = new Payment();
    }

    public function getPaymentStats() {
        return $this->paymentModel->getPaymentStats();
    }

    public function getPaymentBreakdown($search = '') {
        return $this->paymentModel->getPaymentBreakdown($search);
    }

    public function getMonthlyRevenueTrend($months = 6) {
        return $this->paymentModel->getMonthlyRevenueTrend($months);
    }

    public function getTopEarningDrivers() {
        return $this->paymentModel->getTopEarningDrivers();
    }

    public function getPaymentById($paymentID) {
        return $this->paymentModel->getPaymentById($paymentID);
    }

    public function updatePaymentStatus($paymentID, $newStatus) {
        return $this->paymentModel->updatePaymentStatus($paymentID, $newStatus);
    }

    public function getMonthlyTransactionData($year = null) {
    return $this->paymentModel->getMonthlyTransactionData($year);
}
}
