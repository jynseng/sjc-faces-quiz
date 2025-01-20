<?php
$postedData = file_get_contents("php://input");
if (!$postedData) {
    http_response_code(400);
    die("Error: No data provided");
}
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$username = $data['username'];
$first_name = $data['firstName'];
$last_name = $data['lastName'];

try {
    $db = new PDO('sqlite:faces.db');
} catch (PDOException $e) {
    // Handle db connection error
    error_log("Database connection error: " . $e->getMessage());
    die(json_encode(['error' => 'Could not connect to the database.']));
}

try {
    $addUser = $db->prepare("INSERT INTO user (username, first_name, last_name) VALUES (:username, :first_name, :last_name)");
    $addUser->execute([
        ':username' => $username,
        ':first_name' => $first_name,
        ':last_name' => $last_name
    ]);
} catch (Exception $e) {
    error_log("Database query error: " . $e->getMessage());
}

// Retrieve user's user_id from db
function selectID($username) {
    global $db;

    try {
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
        }
        return $userID;
    } catch (Exception $e) {
        error_log("Database query error: " . $e->getMessage());
    }
}

echo(json_encode(selectID($username))); // Echo user id
$db = null;