<?php
// Sends dictionary of game modes, including year, tags, and role.
$db = new SQLite3("faces.db");

$json = file_get_contents("php://input");
if (!$json) {
    http_response_code(400);
    die("Error: No data provided");
}
$data = json_decode($json, true);
$userId = $data['userId'];
$access_level = 0;

// Query db for access level
$stmt = $db->prepare("SELECT access_level FROM user WHERE id = :id");
$stmt->bindValue(':id', $userId, SQLITE3_INTEGER);
$result = $stmt->execute();
$row = $result->fetchArray(SQLITE3_ASSOC);
$access_level = $row['access_level'];

$gamemodeDict = [];
$sql = "SELECT * FROM mode WHERE enabled = 1 AND CAST(min_access_level as INTEGER) <= :level";
$stmt = $db->prepare($sql);
$stmt->bindValue(':level', $access_level, SQLITE3_INTEGER);
$result = $stmt->execute();

while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $gamemodeDict[$row["id"]]["display_name"] = $row["display_name"];
    $gamemodeDict[$row["id"]]["year"] = $row["year"];
    $gamemodeDict[$row["id"]]["tags"] = $row["tags"];
    $gamemodeDict[$row["id"]]["role"] = $row["role"];
    $gamemodeDict[$row["id"]]["description"] = $row["description"];
}

$db = null;
echo json_encode($gamemodeDict);