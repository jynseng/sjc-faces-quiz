<?php
$leaderboardSlots = 25;
$db=new SQLite3("faces.db");
$scoreDict = [];

$sql = "WITH max_per_mode AS (
            SELECT player_name, mode_id, max(score) AS high_score FROM score
            GROUP BY player_name, mode_id
        )
        SELECT player_name, sum(high_score) AS high_score FROM max_per_mode
        GROUP BY player_name
        ORDER BY high_score DESC
        LIMIT {$leaderboardSlots};";
$result = $db->query($sql);
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $scoreDict[] = $row;
}

echo json_encode($scoreDict);