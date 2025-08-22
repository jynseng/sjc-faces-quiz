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

// // Query faces.db to get dictionary of names mapped to image filepaths for given set.
function getImageDict($year=null, $tag=null, $role=null, $db=null) {
    if ($db === null) {
        $db = new SQLite3("faces.db");
    }

    $year = convertNullString($year);
    $tag  = convertNullString($tag);
    $role = convertNullString($role);

    $sql = "SELECT first_name, last_name, file_path, accepted_first_names, role
            FROM person p 
            JOIN image i ON p.id = i.person_id";

    $whereClauses = [];

    // Handle year filter
    if (!is_null($year)) {
        $whereClauses[] = "year IN ($year)";
        if (is_null($role)) {
            $whereClauses[] = "p.role != 'legacy'";
        }
    }

    // Handle tag filter (image tags)
    if (!is_null($tag)) {
        $whereClauses[] = "i.tags LIKE '%" . SQLite3::escapeString($tag) . "%'";
    }

    // Handle role filter (person tags)
    if (!is_null($role)) {
        $roles = array_map('trim', explode(',', $role)); // ["camper", "staff"]
        $roleConditions = [];
        foreach ($roles as $r) {
            $r = SQLite3::escapeString($r);
            $roleConditions[] = "p.role LIKE '%$r%'";
        }
        if (!empty($roleConditions)) {
            $whereClauses[] = "(" . implode(" OR ", $roleConditions) . ")";
        }
    }

    // Build final SQL
    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(" AND ", $whereClauses);
    }
    $sql .= ";";

    $result = $db->query($sql);
    $personDict = [];

    // Build dictionary of people with image lists + nicknames
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $key = $row["first_name"] . "_" . $row["last_name"];
        if (!array_key_exists($key, $personDict)) {
            $personDict[$key] = [
                "images" => [],
                "nicknames" => $row["accepted_first_names"] 
                    ? array_map('trim', explode(",", $row["accepted_first_names"])) 
                    : []
            ];
        }
        $personDict[$key]["images"][] = "server/" . $row["file_path"];
    }

    return $personDict;
}

// Fetch specific set of faces (defaults to all).
if (isset($_GET["tag"])) {
    $tag = $_GET["tag"];
    if ($tag == "all") {
        $tag = null;
    }
} else {
    $tag = null;
}

if (isset($_GET["year"])) {
    $year = $_GET["year"];
    if ($year == "all") {
        $year = null;
    }
} else {
    $year = null;
}

if (isset($_GET["role"])) {
    $role = $_GET["role"];
} else {
    $role = null;
}

echo json_encode(getImageDict($year,$tag,$role));