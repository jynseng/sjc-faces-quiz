<?php
// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
        http_response_code(403);
        exit;
    }
}

// Pull the latest changes from the repository
shell_exec('cd /var/www/html && git pull origin main 2>&1');

http_response_code(200);
