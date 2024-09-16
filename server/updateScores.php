<?php
// Accepts POST name and score pair, sort through scores.json and input score in leaderboard (existing scores take higher
// place). Echo current top ten scores.

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$postedData = file_get_contents("php://input");
$leaderboardSlots = 25;
$db = new SQLite3('faces.db');

if (!$postedData) {
    http_response_code(400);
    die("Error: No data provided");
}
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$status = $data["status"];
$name = $data["name"];
$score = $data["score"];
$gameModeId = $data["gameModeId"];
$errors = $data["errors"];
$skips = $data["skips"];
$userId = $data["userId"];

// Insert new score into score table
$insertScoreSql = "INSERT INTO score (username, user_id, mode_id, score, errors, skips) values ('{$name}', {$userId}, {$gameModeId}, {$score}, {$errors}, {$skips})";
$db->exec($insertScoreSql);

// Get leaderboard for current game mode
$getScoreSql = "SELECT username, max(score) AS high_score FROM score
                WHERE mode_id = {$gameModeId}
                    AND score > 0
                GROUP BY username
                ORDER BY high_score DESC
                LIMIT {$leaderboardSlots}";
$result = $db->query($getScoreSql);
$scoreDict = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $scoreDict[] = $row;
}
$db = null;
echo json_encode($scoreDict);