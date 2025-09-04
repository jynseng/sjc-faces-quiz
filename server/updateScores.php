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

$scoreStatus = 'none'; // Personal best, high score, etc.

try {
    // Get user's personal best score for current game mode
    $getUserBest = "SELECT max(score) AS high_score FROM score
                    WHERE mode_id = {$gameModeId}
                    AND user_id = {$userId}
                    AND score > 0";
    $result = $db->query($getUserBest);
    $personalBest = $result->fetchArray(SQLITE3_ASSOC)['high_score']; // User's best ever score for game mode

    // Get current best score from anyone
    $getHighScore = "SELECT max(score) AS high_score FROM score
                    WHERE mode_id = {$gameModeId}
                    AND score > 0";
    $result = $db->query($getHighScore);
    $highScore = $result->fetchArray(SQLITE3_ASSOC)['high_score']; // Top score on leaderboard

    if ($highScore < $score) {
        $scoreStatus = 'new high score';
    } else if ($personalBest < $score) {
        $scoreStatus = 'personal best';
    } else if ($personalBest > $score*1.1 && $score > 7) {
        $scoreStatus = 'poor';
    } else if ($score < 8) {
        $scoreStatus = 'pathetic';
    }
} catch (Exception $e) {
    echo 'General error: '.$e->getMessage();
}

try {
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
} catch (Exception $e) {
    echo 'General error: '.$e->getMessage();
}

$scoreDict = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $scoreDict[] = $row;
}
$data = json_encode([
    'scoreStatus' => $scoreStatus,
    'scores' => $scoreDict
]);
echo $data; // Send back updated scoreboard

// Get gamemode name from id
$getModeNameSql = "SELECT display_name FROM mode WHERE id = {$gameModeId}";
$result = $db->query($getModeNameSql);
if ($result) {
    $modeName = $result->fetchArray(SQLITE3_ASSOC)['display_name'];
}
$db = null;

// Publish score to redis, to broadcast to other users
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);
$message = json_encode([
    'type' => 'score',
    'user' => $name,
    'score' => $score,
    'gameMode' => $modeName,
    'scoreStatus' => $scoreStatus
]);
$redis->publish('scores', $message);