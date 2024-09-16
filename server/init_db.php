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
        year INTEGER,
        date_added DATE DEFAULT CURRENT_DATE,
        FOREIGN KEY(person_id) REFERENCES person(id)
    );
');

$db->exec('
    CREATE TABLE IF NOT EXISTS mode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        display_name TEXT NOT NULL,
        year INTEGER,
        tags TEXT,
        enabled INTEGER,
        description TEXT
    );
');

$db->exec('
    CREATE TABLE IF NOT EXISTS score (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        mode_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        errors INTEGER NOT NULL,
        skips INTEGERT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(mode_id) REFERENCES mode(id),
        FOREIGN KEY(user_id) REFERENCES user(id)
    );
');

$db->exec('
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        permission_level TEXT DEFAULT user,
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    );
');

echo "Database initialized successfully.";