<?php
// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Invalid request method", 3, '/etc/var/www/sjc-faces-quiz/logs/webhook_errors.log');
    http_response_code(405);
    exit;
}

// Get the raw POST data
$payload = file_get_contents('php://input');
$secret = 'brunolives';

// Verify the signature (optional but recommended)
if (isset($_SERVER['HTTP_X_HUB_SIGNATURE_256'])) {
    $signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    if (!hash_equals($signature, $_SERVER['HTTP_X_HUB_SIGNATURE_256'])) {
        error_log("Signature mismatch", 3, '/etc/var/www/sjc-faces-quiz/logs/webhook_errors.log');
        http_response_code(403);
        exit;
    }
}

// Pull the latest changes from the repository
$output = shell_exec('cd /etc/var/www/sjc-faces-quiz && git pull origin master 2>&1');
error_log($output, 3, '/etc/var/www/sjc-faces-quiz/logs/webhook_errors.log');

http_response_code(200);
