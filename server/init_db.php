<?php
$db = new SQLite3('faces.db');

$db->exec('
    CREATE TABLE IF NOT EXISTS person (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        accepted_first_names TEXT,
        tags TEXT
    );
');

$db->exec('
    CREATE TABLE IF NOT EXISTS image (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        person_id INTEGER,
        tags TEXT,
        FOREIGN KEY(person_id) REFERENCES person(id)
    );
');

echo "Database initialized successfully.";
?>