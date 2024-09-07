<?php
session_start();

if (isset($_GET['username'])) { 
    $username = $_GET['username'];
}
if (!isset($_SESSION['username'])) {
    $_SESSION['username'] = $username;
} else if ($_SESSION['username'] != $username) { // If username doesn't match (i.e. wrong session accessed)
    session_write_close();
    session_id('');
    session_start();
    $_SESSION['username'] = $username;
}
if (isset($_GET['init'])) { 
    $init = $_GET['init'];
    if ($init == 'true') {
        $_SESSION['last_activity'] = time();
    }
} else {
    $init = 'false';
}
if (!isset($_SESSION['active_users'])) {
    $_SESSION['active_users'] = [$_SESSION['username']];
}

session_write_close();

$timeout = 30; // Seconds after last request before user is taken off active user list
$sessionTimeout = 60 * 60; // Seconds after last request before session is destroyed (1hr)
$sleepTime = 1; // Seconds delay between loops
//$sessionSavePath = '/opt/alt/php81/var/lib/php/session';
$sessionSavePath = '/Applications/MAMP/tmp/php';
if (isset($_SESSION['active_users'])) { $storedActiveUsers = $_SESSION['active_users']; }
$thisSession = $_SESSION;
$currentTime = time();

// Long-polling: Check for active users
while (true) {
    $sessions = scandir($sessionSavePath);
    $currentActiveUsers = [];

    // Loop through php session array, add 'active' users to current array, end sessions for inactive users
    foreach ($sessions as $session) {
        if(strpos($session,'.') === false) { // Skip temp files
            $sessionId = str_replace('sess_','',$session); // Remove 'sess_' prefix
            session_id($sessionId);
            session_start();
            $data = $_SESSION;

            if ($currentTime - $data['last_activity'] <= $timeout) {
                $currentActiveUsers[] = $data['username'];
            } else if ($currentTime - $data['last_activity'] >= $sessionTimeout) {
                session_destroy();
            }
            session_write_close();
        }
    }
    $_SESSION = $thisSession; // Reset $_SESSION back to user's session

    // Compare the current active users with the stored list
    $usersAdded = array_diff($currentActiveUsers, $storedActiveUsers);
    $usersRemoved = array_diff($storedActiveUsers, $currentActiveUsers);

    // If there are any changes or if this is the first req, send the array of active users
    if (!empty($usersAdded) || !empty($usersRemoved) || $init == 'true') {
        // Update the stored active users list
        session_start();
        $_SESSION['active_users'] = $currentActiveUsers;
        session_write_close();
        echo json_encode(['activeUsers' => $currentActiveUsers,]);
        
        exit;
    }  

    // Sleep for x seconds
    sleep($sleepTime);

    // Break the loop if it exceeds the 20s long-polling timeout
    if ((time() - $_SERVER['REQUEST_TIME']) > 20) {
        echo json_encode(['activeUsers' => $currentActiveUsers,]);
        exit;
    }
}
// $db = new PDO('sqlite:faces.db');
// $sessionId = session_id();
// $userId = 1;
// // Update user's last activity timestamp in sqlite db
// $updateStmt = $db->prepare("INSERT INTO user_sessions (session_id, user_id, last_activity) VALUES (:session_id, :user_id, :last_activity)
//                             ON CONFLICT(session_id) DO UPDATE SET last_activity = :last_activity");
// $updateStmt->execute([
//     ':session_id' => $sessionId,
//     ':user_id' => $userId,
//     ':last_activity' => time()
// ]);