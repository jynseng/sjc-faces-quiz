<?php
$leaderboard = "/home/u955586838/domains/sjcfacesgame.com/public_html/scores.json";
$postedData = file_get_contents("php://input");

if (!postedData) {
    http_response_code(400);
    die("Error: No data provided");
}
file_put_contents($leaderboard, $postedData);

?>