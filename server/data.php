<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

function convertNullString($str) {
    if ($str == 'null') {
        return null;
    }
    return $str;
}

// Query faces.db to get dictionary of names mapped to image filepaths for given set.
function getImageDict($year=null, $tag=null, $db=new SQLite3("faces.db")) {
    $year = convertNullString($year);
    $tag = convertNullString($tag);
    
    $sql = "SELECT first_name, last_name, file_path, accepted_first_names FROM person p JOIN image i ON p.id = i.person_id";
    if (!is_null($year) && !is_null($tag)) { // i.e. 2024 camper
        $sql = $sql . " WHERE year IN " . "($year)" . " AND i.tags LIKE '%" . $tag . "%'";
    }
    elseif (!is_null($year) && is_null($tag)) { // i.e. "2024"
        $sql = $sql . " WHERE year IN " . "($year)";
    }
    elseif (is_null($year) && !is_null($tag)) { // i.e. "stamp"
        $sql = $sql . " WHERE i.tags LIKE '%" . $tag . "%'";
    }
    $sql = $sql . ";";

    $result = $db->query($sql);
    $personDict = [];

    // Create dictionary of array of dictionaries.
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        //$imageDict[$row["first_name"]."_".$row["last_name"]][] = "server/faces/".$row["file_path"];

        if (!array_key_exists($row["first_name"]."_".$row["last_name"], $personDict)) {
            $personDict[$row["first_name"]."_".$row["last_name"]] = array("images" => ["server/faces/".$row["file_path"]], "nicknames" => $row["accepted_first_names"] ? explode(",", $row["accepted_first_names"]) : []);
        }
        $personDict[($row["first_name"]."_".$row["last_name"])]["images"][] = "server/faces/".$row["file_path"];
    }
    return $personDict;
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