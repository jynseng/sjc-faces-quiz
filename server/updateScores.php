<?php
// Accepts POST name and score pair, sort through scores.json and input score in leaderboard (existing scores take higher
// place). Echo current top ten scores.

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$leaderboard = "scores.json";
$postedData = file_get_contents("php://input");

if (!$postedData) {
    http_response_code(400);
    die("Error: No data provided");
}
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$status = $data["status"];
$name = $data["name"];
$score = $data["score"];
$time = $data["timestamp"];

// Read current scores.json file
$scoresJSON = file_get_contents($leaderboard);
$currentScores = json_decode($scoresJSON, true);

// Loop through current scores. If player exists, check if new score is higher. 
$addNewScore = true;
if ($score > 0 && $status == true) { // If player score is 0, or if the game isn't over, don't bother checking or adding.
    foreach ($currentScores as $index => $arrayEntry) {
        if ($arrayEntry["name"] === $name) {
            if ($arrayEntry["score"] < $score) {
                unset($currentScores[$index]);
            } else {
                $addNewScore = false; // If new score isn't higher, don't add it to leaderboard
            }
            break;
        }
    }
} else {
    $addNewScore = false;
}

// Add the new score to the leaderboard if player is new, or if it's a new high score for player.
if ($addNewScore) {
    $newEntry = array("name" => $name, "score" => $score, "timestamp" => $time);
    $currentScores[] = $newEntry;
}

// Sort scores in descending order
usort($currentScores, function ($a, $b) {
    if ($a["score"] == $b["score"]) return 0;
    else if ($a["score"] < $b["score"]) return 1;
    else return -1;
});

// Save updated list back to file
$newJSONData = json_encode($currentScores, JSON_PRETTY_PRINT);
if (file_put_contents($leaderboard, $newJSONData) === false) {
    throw new Exception("Failed to save data.");
}

// Echo top 10 scores
echo json_encode(array_slice($currentScores, 0, 25));

?>