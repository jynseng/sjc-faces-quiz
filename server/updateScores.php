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

// Insert new score into score table
$insertScoreSql = "INSERT INTO score (player_name, mode_id, score) values ('{$name}', {$gameModeId}, {$score})";
$db->exec($insertScoreSql);

// Get leaderboard for current game mode
$getScoreSql = "SELECT player_name, max(score) AS high_score FROM score
                WHERE mode_id = {$gameModeId}
                    AND score > 0
                GROUP BY player_name
                ORDER BY high_score DESC
                LIMIT {$leaderboardSlots}";
$result = $db->query($getScoreSql);
$scoreDict = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $scoreDict[] = $row;
}

// Echo top scores
echo json_encode($scoreDict);

?>