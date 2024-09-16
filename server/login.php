<?php
if (isset($_GET['username'])) { 
    $username = $_GET['username'];
}
$userID = "";
$db = new PDO('sqlite:faces.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Enable exception mode

// Retrieve user's user_id from db
function selectID($username) {
    global $userID, $db;
    
    $selectId = $db->prepare("SELECT id FROM user WHERE username = :username");
    if (!$selectId) {
        throw new Exception('Failed to prepare statement.');
    }
    $selectId->execute([':username' => $username]);
    $id = $selectId->fetch(PDO::FETCH_ASSOC);
    $userID = $id;
    if ($id) {
        $userID = $id['id'];
        session_start();
        $_SESSION['user_id'] = $userID;
        session_write_close();
        logLoginToDb(); // Log this login to db
    }
    $db = null;
    return $id;
}

// Update an existing user's last login timestamp in sqlite db
function logLoginToDb() {
    global $userID, $db;
    try {
        $updateStmt = $db->prepare("UPDATE user SET last_login = CURRENT_TIMESTAMP WHERE id = :id");
        $updateStmt->execute([':id' => $userID]);
    } catch (PDOException $e) {
        echo 'Db error: '.$e->getMessage();
    } catch (Exception $e) {
        echo 'General error: '.$e->getMessage();
    }
}

selectID($username);
echo(json_encode($userID));