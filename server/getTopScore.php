<?php
$postedData = file_get_contents("php://input");

if (!$postedData) {
    http_response_code(400);
    die("Error: No data provided");
}
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$db = new SQLite3("faces.db");
$gameModeId = $data["gameModeId"];
$userId = $data["userId"];

try {
// Get leaderboard for current game mode
$getTopScore = "SELECT max(score) FROM score
                WHERE mode_id = {$gameModeId}
                AND user_id = {$userId}
                AND score > 0";
$result = $db->query($getTopScore);
} catch (Exception $e) {
    echo 'General error: '.$e->getMessage();
}

$db = null;
echo json_encode($result);