<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Query faces db to get dictionary of names mapped to image filepaths.
function getImageDict($year=null, $tag=null, $db=new SQLite3("faces.db")) {
    $sql = "SELECT first_name, last_name, file_path FROM person p JOIN image i ON p.id = i.person_id";
    if (!is_null($year) && !is_null($tag)) {
        $sql = $sql . " WHERE year = " . $year . " AND i.tags LIKE '%" . $tag . "%'";
    }
    elseif (!is_null($year) && is_null($tag)) {
        $sql = $sql . " WHERE year = " . $year;
    }
    elseif (is_null($year) && !is_null($tag)) {
        $sql = $sql . " WHERE i.tags LIKE '%" . $tag . "%'";
    }
    $sql = $sql . ";";

    $result = $db->query($sql);
    $imageDict = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $imageDict[$row["first_name"]."_".$row["last_name"]][] = "server/faces/".$row["file_path"];
    }
    return $imageDict;
}

// Fetch specific set of faces (defaults to all).
if (isset($_GET["set"])) {
    $set = $_GET["set"];
    if ($set == "all") {
        $set = null;
    }
} else {
    $set = null;
}

if (isset($_GET["year"])) {
    $year = $_GET["year"];
    if ($year == "all") {
        $year = null;
    }
} else {
    $year = null;
}

echo json_encode(getImageDict($year,$set));

?>