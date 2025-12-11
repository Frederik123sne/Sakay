<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../src/controllers/AuthController.php';
require_once __DIR__ . '/../../src/core/Request.php';
require_once __DIR__ . '/../../src/core/Response.php';
require_once __DIR__ . '/../../src/core/Session.php';

// Create Request and Response objects
$request = new Request();
$response = new Response();

// Instantiate controller
$authController = new AuthController();

// Handle registration
$result = $authController->register($request, $response);

// Send response
$result->send();
