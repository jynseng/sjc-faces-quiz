<?php
// Accepts POST name and score pair, sort through scores.json and input score in leaderboard (existing scores take higher
// place). Echo current top ten scores.

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$leaderboard = "/home/u955586838/domains/sjcfacesgame.com/public_html/scores.json";
$postedData = file_get_contents("php://input");

if (!$postedData) {
    http_response_code(400);
    die("Error: No data provided");
}
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$name = $data["name"];
$score = $data["score"];
$time = $data["timestamp"];

// Read current scores.json file
$scoresJSON = file_get_contents($leaderboard);
$currentScores = json_decode($scoresJSON, true);

// Loop through current scores and if new score doesn't already exist, add it
// Key is the index, values are arrays
$addNewScore = true;
foreach ($currentScores["scores"] as $key => $value) {
    // if ($value["name"] == $name) {
    //     if ($value["score"] < $score) {
    //         $value["score"] = $score;
    //         $value["timestamp"] = $time;
    //     }
    //     $addNewScore = false;
    //     return;
    // } else {
    //     $addNewScore = true;
    // }
    echo ($value['name'] == $name);
}

if ($addNewScore) {
    $newEntry = array("name" => $name, "score" => $score, "timestamp" => $time);
    $currentScores["scores"][] = $newEntry;
}

// Sort scores in descending order
usort($currentScores["scores"], function ($a, $b) {
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
echo json_encode(array_slice($currentScores["scores"], 0, 10));

?>