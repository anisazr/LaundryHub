<?php

declare(strict_types=1);

$host = getenv('LAUNDRYHUB_DB_HOST') ?: '127.0.0.1';
$port = getenv('LAUNDRYHUB_DB_PORT') ?: '3306';
$database = getenv('LAUNDRYHUB_DB_NAME') ?: 'laundryhub';
$username = getenv('LAUNDRYHUB_DB_USER') ?: 'root';
$password = getenv('LAUNDRYHUB_DB_PASS') ?: '';

$dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Database LaundryHub belum terhubung.',
        'detail' => $exception->getMessage(),
    ]);
    exit;
}

