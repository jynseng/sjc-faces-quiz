<?php
function getGameModeDict($db=new SQLite3("faces.db")) {
    $gamemodeDict = [];
    $sql = "SELECT * FROM mode";
    $result = $db->query($sql);
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $gamemodeDict[$row["id"]]["display_name"] = $row["display_name"];
        $gamemodeDict[$row["id"]]["year"] = $row["year"];
        $gamemodeDict[$row["id"]]["tags"] = $row["tags"];
    }
    return $gamemodeDict;
}

echo json_encode(getGameModeDict());
?>