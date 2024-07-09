<?php
// Accepts POST name and score pair, sort through scores.json and input score in leaderboard (existing scores take higher
// place). Echo current top ten scores.

$leaderboard = "/home/u955586838/domains/sjcfacesgame.com/public_html/scores.json";
$postedData = file_get_contents("php://input");

if (!postedData) {
    http_response_code(400);
    die("Error: No data provided");
}
$name = htmlspecialchars($_POST['name']);
$score = htmlspecialchars($_POST['score']);

echo "Name: " . $name . "<br>";
echo "Score: " . $score . "<br>";

?>