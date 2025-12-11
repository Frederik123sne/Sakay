<?php
require_once __DIR__ . '/../../src/core/Session.php';
Session::start();
Session::logout();

// Redirect to auth page
header('Location: ../auth.php');
exit;
