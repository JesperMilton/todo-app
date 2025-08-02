<?php

/** LOAD Environment variables */
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$server = $_ENV['DB_HOST'];
$user   = $_ENV['DB_USER'];
$pass   = $_ENV['DB_PASS'];
$dbname = $_ENV['DB_NAME'];

$mysqli = new mysqli($server, $user, $pass, $dbname);
if ($mysqli->connect_error) {
    die("Error: " . $mysqli->connect_error);
}

function upsert_user($idToken) {  
    global $mysqli;
    
    $google_id = $idToken['sub'];
    $display_name = $idToken['name'];
    $profile_url = $idToken['picture'];

    $query = 'INSERT INTO  users (google_id, display_name, profile_url)  VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), profile_url = VALUES(profile_url);';


    $stmt = $mysqli->stmt_init();
    $stmt->prepare($query);

    $stmt->bind_param("sss", $google_id, $display_name, $profile_url);

    $stmt->execute();

    $selectStmt = $mysqli->prepare("SELECT * FROM users WHERE google_id = ?");
    $selectStmt->bind_param("s", $google_id);
    $selectStmt->execute();
    $result = $selectStmt->get_result();
    return $result->fetch_assoc();
}