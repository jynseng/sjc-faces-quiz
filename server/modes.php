<?php
// Sends dictionary of game modes, including year and tags.
function getGameModeDict($db=new SQLite3("faces.db")) {
    $gamemodeDict = [];
    $retries = 5;
    $delay = 100; // miliseconds
    while ($retries > 0) {
        try {
            $sql = "SELECT * FROM mode WHERE enabled = 1";
            $result = $db->query($sql);
            //$db = null;
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $gamemodeDict[$row["id"]]["display_name"] = $row["display_name"];
                $gamemodeDict[$row["id"]]["year"] = $row["year"];
                $gamemodeDict[$row["id"]]["tags"] = $row["tags"];
            }
            return $gamemodeDict;
        } catch (PDOException $e) {
            if ($db->lastErrorMsg() == 'database is locked') {
                $retries--;
                usleep($delay * 1000);
            } else {
                throw $e;
            }
        }
    }
}
echo json_encode(getGameModeDict());