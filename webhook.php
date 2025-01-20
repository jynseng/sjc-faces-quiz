<?php
// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Invalid request method", 3, '/var/www/html/sjcfacesgame/logs/webhook_errors.log');
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
        error_log("Signature mismatch", 3, '/var/www/html/sjcfacesgame/logs/webhook_errors.log');
        http_response_code(403);
        exit;
    }
}

// Reset and pull the latest changes from the repository
$commands = [
    'cd /var/www/html/sjcfacesgame',
    'git reset --hard HEAD',
    'git pull origin master'
];
$output = shell_exec(implode(' && ', $commands) . ' 2>&1');

if (!$output) {
    $output = "No output from git pull";
}

error_log($output, 3, '/var/www/html/sjcfacesgame/logs/webhook_errors.log');
error_log("shell_exec: " . (function_exists('shell_exec') ? 'enabled' : 'disabled'), 3, '/var/www/html/sjcfacesgame/logs/webhook_errors.log');
error_log(print_r($_ENV, true), 3, '/var/www/html/sjcfacesgame/logs/webhook_errors.log');

http_response_code(200);
