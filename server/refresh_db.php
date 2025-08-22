<?php
$db = new SQLite3('faces.db');
$facesDir = 'faces';
$roles = ['staff', 'camper', 'alum', 'past', 'legacy'];
$id="";
$year=null;
$personName="";
$imageCount=0;
$removeCount=0;

function fetchPerson($personName) {
    global $db;
    $selectPerson = $db->prepare("SELECT id, role FROM person WHERE first_name = :first_name AND last_name = :last_name");
    
    // Select person from db
    $selectPerson->bindValue(':first_name', $personName[0], SQLITE3_TEXT);
    $selectPerson->bindValue(':last_name', $personName[1], SQLITE3_TEXT);
    $result = $selectPerson->execute();
    return($result->fetchArray(SQLITE3_ASSOC));
}

// Scan faces directory; add person to person table if needed, add img files to image table if needed.
// Update each person's tags based on its enclosing folder, i.e. alum or staff
function addToDB($dir, $db) {
    global $id, $year, $roles, $personName, $imageCount, $facesDir;
    $files = scandir($dir);

    $addFace = $db->prepare("INSERT OR IGNORE INTO person (first_name, last_name, role) VALUES (:first_name, :last_name, :tag)");
    $updateTag = $db->prepare("UPDATE person SET role = :tag WHERE id = :id");

    foreach ($roles as $roleFolder) {
        $rolePath = $facesDir . DIRECTORY_SEPARATOR . $roleFolder; // i.e. faces/staff
        if (!is_dir($rolePath)) continue;

        $peopleFolders = scandir($rolePath);
        if ($peopleFolders === false) {
            echo "Failed to read directory: $rolePath\n";
            continue; // skip this folder
        }

        foreach ($peopleFolders as $personFolder) { // Loop through person folders
            // i.e. $personFolder = Andrew_Kim
            if ($personFolder === '.' || $personFolder === '..') continue; // Skip current and parent directories

            $fullPersonPath = $rolePath . DIRECTORY_SEPARATOR . $personFolder; // i.e. faces/staff/Andrew_Kim
            if (!is_dir($fullPersonPath)) continue;

            $tag = $roleFolder;

            // Select person from db
            $personName = explode('_', basename($personFolder));
            $person = fetchPerson($personName);

            if (!$person) { // If person not in db, add to db
                $addFace->bindValue(':first_name', $personName[0], SQLITE3_TEXT);
                $addFace->bindValue(':last_name', $personName[1], SQLITE3_TEXT);
                $addFace->bindValue(':tag', $tag, SQLITE3_TEXT);
                $addFace->execute();
                $id = fetchPerson($personName)['id'];

                echo "\r\n".$personName[0].' '.$personName[1].' added to person table'."\r\n";
            } else { // If already in db, just update their role
                $id = $person['id'];

                // Update their 'role' field with their role, i.e. past or camper
                if ($person['role'] !== $tag) {
                    $updateTag->bindValue(':tag', $tag, SQLITE3_TEXT);
                    $updateTag->bindValue(':id', $id, SQLITE3_INTEGER);
                    $updateTag->execute();
                    if ($db->changes() > 0) {
                        echo "\r\n".$personName[0].' '.$personName[1]." role updated to '$tag'\r\n";
                    } else {
                        echo "Update executed but no row changed\n";
                    }
                }
            }
            loopContents($fullPersonPath, $id); // After checking person, check images. i.e. $personFolder = faces/staff/Andrew_Kim
        }
    }
}

# Recursively loop through contents of a person folder for images
function loopContents($folder, $id, $set=null) {
    // i.e. faces/staff/Andrew_Kim
    global $facesDir, $year, $personName, $imageCount, $db, $roles;
    $selectImage = $db->prepare("SELECT * FROM image WHERE file_path = :file_path");
    $addImg = $db->prepare("INSERT OR IGNORE INTO image (file_path, person_id, tags, year) VALUES (:file_path, :person_id, :tag, :year)");

    $year = $set;
    $tag = $set;
    if ($set && (filter_var($set, FILTER_VALIDATE_INT) !== false)) {
        $year = (int)$tag;
        $tag = null;
    } else { $year = null; }

    $items = scandir($folder);
    
    // Loop through contents of person folder. Contents may be image file or folder.
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || $item === '.DS_Store') continue; // Skip current and parent directories
        $filePath = $folder . DIRECTORY_SEPARATOR . $item; // i.e. faces/staff/Andrew_Kim/2023

        if (str_contains(mime_content_type($filePath), 'image')) { // item is image file        
            $selectImage->bindValue(':file_path', $filePath, SQLITE3_TEXT);
            $result = $selectImage->execute();

            // If not in db, add to db
            if (!$result->fetchArray(SQLITE3_ASSOC)) {
                $parentDir = basename(dirname($filePath, 2));
                if (in_array($parentDir, $roles)) { $year = null; }
                // Insert the image path into the database
                $addImg->bindValue(':file_path', $filePath, SQLITE3_TEXT); // i.e. staff/Alex_Bae/2024/01.jpg
                $addImg->bindValue(':person_id', $id, SQLITE3_INTEGER);
                $addImg->bindValue(':tag', $tag, SQLITE3_TEXT);
                $addImg->bindValue(':year', $year, SQLITE3_INTEGER);
                $addImg->execute();

                $imageCount++;
                echo $filePath.' added to image table'."\r\n";
            }
        } else if (is_dir($filePath)){
            loopContents($filePath, $id, $item);
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
            if (!file_exists($row['file_path'])) {
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