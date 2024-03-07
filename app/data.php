<?php
$campersDir = "/Users/dank/Documents/SJC/sjc-faces-quiz/faces/campers";
$staffDir = "/Users/dank/Documents/SJC/sjc-faces-quiz/faces/staff";
$facesDir = "/Users/dank/Documents/SJC/sjc-faces-quiz/faces/";
$facesDict = [];

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Recursively scan 'faces' directory
// For now, campers and staff are combined. Later, will need to be separated so users can choose which set to use.
function scanAllDir($dir,$parent='') {
    global $facesDict;

    foreach(scandir($dir) as $filename) {
        if ($filename[0] === '.' || $filename[0] === 'DS_Store') continue; // Skip dots
        $filePath = $dir . '/' . $filename;
        if (is_dir($filePath)) {
            foreach (scanAllDir($filePath,$filename) as $childFilename) {} // Recursive call
        } else {
            $facesDict[$parent][] = $filePath; // If $filepath leads to an img, add to array for that name.
        }
    }
    return $facesDict;
}

// Returns an array of people from either campers, staff, or both.
function getFaceSet() {
    echo json_encode(scanAllDir($campersDir));
}

echo $_SERVER['PHP_SELF'];

//if (isset($_GET['set'])) {
    //$set = $_GET['set'];
    $set = 'all';
    switch ($set) {
        case 'all':
            echo json_encode(scanAllDir($facesDir));
            break;
        case 'campers':
            echo json_encode(scanAllDir($campersDir));
            break;
        case 'staff':
            echo json_encode(scanAllDir($staffDir));
            break;
    }
// } else {
//     echo 'no params';
// }
?>