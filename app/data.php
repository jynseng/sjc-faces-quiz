<?php
$campersDir = "/home/u955586838/domains/sjcfacesgame.com/public_html/faces/campers";
$staffDir = "/home/u955586838/domains/sjcfacesgame.com/public_html/faces/staff";
$facesDir = "/home/u955586838/domains/sjcfacesgame.com/public_html/faces";
$facesDict = [];
$directory = "";

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Recursively scan 'faces' directory
// For now, campers and staff are combined. Later, will need to be separated so users can choose which set to use.
function scanAllDir($dir,$parent='') {
    global $facesDict;
    global $directory;

    foreach(scandir($dir) as $filename) {
        if ($filename[0] === '.' || $filename[0] === 'DS_Store') continue; // Skip dots
        
        $filePath = $dir . '/' . $filename;
        if (is_dir($filePath)) {
            foreach (scanAllDir($filePath,$filename) as $childFilename) {} // Recursive call
        } else {
            $set = basename(dirname($dir));
            if ($set === "campers") {
                $directory = "campers/";
            } else if ($set === "staff") {
                $directory = "staff/";
            }
            $facesDict[$parent][] = 'faces/'.$directory.$parent.'/'.$filename; // If $filepath leads to an img, add to array for that name.
        }
    }
    return $facesDict;
}

//if (isset($_GET['set'])) {
    //$set = $_GET['set'];
    $set = 'all';
    switch ($set || null) {
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
?>