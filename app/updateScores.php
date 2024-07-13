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

// Read current scores.json file
$scoresJSON = file_get_contents($leaderboard);
$currentScores[] = json_decode($scoresJSON, true);

$newEntry = array("name" => $name, "score" => $score);
$currentScores["scores"] = $newEntry;

// Sort scores in descending order
usort($currentScores["scores"], function ($a, $b) {
    echo "<script>";
    echo "console.log('$a');";
    echo "</script>";    
    return $b["score"] - $a["score"];
});

// Save updated list back to file
$newJSONData = json_encode($currentScores, JSON_PRETTY_PRINT);
if (file_put_contents($leaderboard, $newJSONData) === false) {
    throw new Exception("Failed to save data.");
}

// Echo top 10 scores
echo json_encode(array_slice($currentScores, 0, 10));

?>