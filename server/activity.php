<?php
// Update the user's last activity time
session_start();
$_SESSION['last_activity'] = time();
echo($_SESSION['username']);
session_write_close();
?>