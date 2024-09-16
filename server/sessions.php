<?php
session_start();
$_SESSION['SameSite'] = 'Lax';

if (isset($_GET['username'])) { 
    $username = $_GET['username'];
    $_SESSION['username'] = $username;
}
// if (isset($_GET['userId'])) {
//     $_SESSION['user_id'] = $_GET['userId'];
// }
if (isset($_GET['init'])) { 
    $init = $_GET['init'];
    if ($init == 'true') { // Initial request case
        $_SESSION['last_activity'] = time();
    }
} else {
    $init = 'false';
}
if (!isset($_SESSION['active_users'])) {
    $_SESSION['active_users'] = [$_SESSION['username']];
}

session_write_close();

$timeout = 20; // Seconds after last request before user is taken off active user list
$sessionTimeout = 60 * 60; // Seconds after last request before session is destroyed (1hr)
$sleepTime = 100000; // Microsecond delay between loops (.1 seconds)
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
    usleep($sleepTime);

    // Break the loop if it exceeds the 20s long-polling timeout
    if ((time() - $_SERVER['REQUEST_TIME']) > 20) {
        echo json_encode(['activeUsers' => $currentActiveUsers,]);
        exit;
    }
}
