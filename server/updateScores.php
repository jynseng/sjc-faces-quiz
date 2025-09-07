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
$name = $data["name"]; // User's username
$score = $data["score"];
$gameModeId = $data["gameModeId"];
$errors = $data["errors"];
$skips = $data["skips"];
$userId = $data["userId"];

$scoreStatus = 'none'; // Personal best, high score, etc.
$scoreBroadcast = ''; // Message to broadcast to other online users
$modeName = '';

// Get gamemode name from id
$getModeNameSql = "SELECT display_name FROM mode WHERE id = {$gameModeId}";
$result = $db->query($getModeNameSql);
if ($result) {
    $modeName = $result->fetchArray(SQLITE3_ASSOC)['display_name'];
}

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

    $insults = ['a measly', 'a paltry', 'a pitiful', 'a sad', 'a disappointing', 'a weak', 'an abysmal', 'an insulting'];
    $randomInsult = $insults[array_rand($insults)];

    switch (true) {
        case $score > $highScore:
            $scoreBroadcast = "<span class='sender'>" . $name . "</span> just set a new high score of <span class='score'>" . $score . "</span> on " . $modeName . " mode! 🤯\nThe rest of you better step it up 👀";
            $scoreStatus = "new high score";
            break;
        case $score == $highScore:
            $scoreBroadcast = "<span class='sender'>" . $name . "</span> just tied the high score of <span class='score'>" . $score . "</span> on " . $modeName . " mode! 😲\nTry harder!";
            break;
        case $score > $personalBest:
            $scoreBroadcast = "<span class='sender'>" . $name . "</span> just got a pr of <span class='score'>" . $score . "</span> on " . $modeName . " mode! 👏\nThat's really good... for them";
            $scoreStatus = "new personal best";
            break;
        case $score == $personalBest;
            $scoreBroadcast = "<span class='sender'>" . $name . "</span> just tied their pr of <span class='score'>" . $score . "</span> on " . $modeName . " mode!\n Next round for sure...";    
            break;
        case $score < $personalBest && $score > 11:
            $scoreBroadcast = "<span class='sender'>" . $name . "</span> just got " . $randomInsult .  " <span class='score'>" . $score . "</span> on " . $modeName . " mode 😢";
            break;
        case $score < 12:
            $scoreBroadcast = "<span class='sender'>" . $name . "</span> just embarassed themselves with a <span class='score'>" . $score . "</span> on " . $modeName . " mode 🤦";
            break;
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
$db = null;

// Publish score to redis, to broadcast to other users
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);
// $message = json_encode([
//     'type' => 'score',
//     'user' => $name,
//     'score' => $score,
//     'gameMode' => $modeName,
//     'scoreStatus' => $scoreStatus
// ]);
$message = json_encode($scoreBroadcast);
$redis->publish('scores', $message);