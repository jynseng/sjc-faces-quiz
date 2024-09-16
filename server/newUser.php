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

$db = new PDO('sqlite:faces.db');
$addUser = $db->prepare("INSERT INTO user (username, first_name, last_name) VALUES (:username, :first_name, :last_name)");
$addUser->execute([
    ':username' => $username,
    ':first_name' => $first_name,
    ':last_name' => $last_name
]);

// Retrieve user's user_id from db
function selectID($username) {
    global $db;

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
}

echo(json_encode(selectID($username))); // Echo user id
$db = null;