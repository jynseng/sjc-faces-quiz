<?php
$leaderboardSlots = 25;
$scoreDict = [];

$sql = "WITH max_per_mode AS (
            SELECT username, mode_id, max(score) AS high_score FROM score
            GROUP BY username, mode_id
        )
        SELECT username, sum(high_score) AS high_score FROM max_per_mode
        GROUP BY username
        ORDER BY high_score DESC
        LIMIT {$leaderboardSlots};";

$db = new SQLite3("faces.db");
$result = $db->query($sql);
$db = null;
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $scoreDict[] = $row;
}

echo json_encode($scoreDict);