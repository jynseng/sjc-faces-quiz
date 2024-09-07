<?php
$db = new SQLite3('faces.db');
$facesDir = 'faces';
$group="";
$id="";
$year=null;
$set=null;
$personName="";
$imageCount=0;
$removeCount=0;

// Scan faces directory; add person to person table if needed, add img files to image table if needed. 
function addToDB($dir, $db) {
    global $group;
    global $id;
    global $year;
    global $set;
    global $personName;
    global $imageCount;
    $files = scandir($dir);

    $addFace = $db->prepare("INSERT OR IGNORE INTO person (first_name, last_name) VALUES (:first_name, :last_name)");
    $addImg = $db->prepare("INSERT OR IGNORE INTO image (file_path, person_id, tags, year) VALUES (:file_path, :person_id, :tags, :year)");
    $selectPerson = $db->prepare("SELECT id FROM person WHERE first_name = :first_name AND last_name = :last_name");
    $selectImage = $db->prepare("SELECT * FROM image WHERE file_path = :file_path");

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue; // Skip current and parent directory references
        }

        $filePath = $dir.DIRECTORY_SEPARATOR.$file;
        
        if (is_dir($filePath)) {            
            // If it's a directory, assume it's a person's folder and add to db if not already there.
            $dirName = explode('_', basename($filePath));
            if (sizeof($dirName) > 1) { // Person Folder
                // Select person from db
                $personName = $dirName;
                $selectPerson->bindValue(':first_name', $personName[0], SQLITE3_TEXT);
                $selectPerson->bindValue(':last_name', $personName[1], SQLITE3_TEXT);
                $result = $selectPerson->execute();
                $person = $result->fetchArray(SQLITE3_ASSOC);

                if (!$person) { // If not in db, add to db
                    $addFace->bindValue(':first_name', $personName[0], SQLITE3_TEXT);
                    $addFace->bindValue(':last_name', $personName[1], SQLITE3_TEXT);
                    $addFace->execute();
                    $id = null;

                    echo "\r\n".$personName[0].' '.$personName[1].' added to person table'."\r\n";
                } else {
                    $id = $person['id'];
                }
            } else if ($file == "staff" || $file == "camper") {
                $group = $file; // Staff or Camper directory
            } else if (is_numeric($file)) {
                    $year = $file;
                    $set = null;
            } else {
                $year = null;
                $set = ','.$file; // "stamp" or "baby"
            }

            // Recursively process the directory.
            addToDB($filePath, $db);
        } else {
            // If it's a file, check if it's an image.
            if (str_contains(mime_content_type($filePath), 'image')) {                
                if (!$id) {

                    $selectPerson->bindValue(':first_name', $personName[0], SQLITE3_TEXT);
                    $selectPerson->bindValue(':last_name', $personName[1], SQLITE3_TEXT);
                    $result = $selectPerson->execute();
                    $person = $result->fetchArray(SQLITE3_ASSOC);
                    $id = $person['id'];
                }

                // Check if file exists in db already
                $path = $group.'/'.basename(dirname(dirname($filePath))).'/'.basename(dirname($filePath)).'/'.$file;
                $selectImage->bindValue(':file_path', $path, SQLITE3_TEXT);
                $result = $selectImage->execute();

                if (!$result->fetchArray(SQLITE3_ASSOC)) {
                    // Insert the image path into the database
                    $addImg->bindValue(':file_path', $path, SQLITE3_TEXT); // i.e. staff/Alex_Bae/2024/01.jpg
                    $addImg->bindValue(':person_id', $id, SQLITE3_INTEGER);
                    $addImg->bindValue(':tags', $group.$set, SQLITE3_TEXT);
                    $addImg->bindValue(':year', $year, SQLITE3_INTEGER);
                    $addImg->execute();

                    $imageCount++;
                    echo $file.' added to image table'."\r\n";
                }
            }
        }
    }
}

// Scan db and remove images that no longer exist.
function removeFromDB($db) {
    global $removeCount;

    $selectFilePaths = $db->prepare('SELECT file_path FROM image');
    $result = $selectFilePaths->execute();

    if ($result) {
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            if (!file_exists('faces/'.$row['file_path'])) {
                $deleteImage = $db->prepare('DELETE FROM image WHERE file_path = :file_path');
                $deleteImage->bindValue(':file_path', $row['file_path'], SQLITE3_TEXT);
                $deleteImage->execute();
                $removeCount++;
                echo $row['file_path'].' removed from image table'."\r\n";
            }
        }
    }
}

addToDB($facesDir, $db);
removeFromDB($db);

echo "\r\n".'Database refresh complete. '.$imageCount.' images added to db, '.$removeCount.' images removed.';