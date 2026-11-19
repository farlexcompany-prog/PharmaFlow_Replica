<?php
declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id || $id <= 0) {
    http_response_code(400);
    echo 'Invalid download ID.';
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, title, file_path FROM downloads WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $item = $stmt->fetch();

    if (!$item) {
        http_response_code(404);
        echo 'Download record not found.';
        exit;
    }

    $safeFilename = basename((string)$item['file_path']);
    $baseDir = realpath(__DIR__ . '/../public/uploads/sample_downloads');
    $fullPath = $baseDir ? realpath($baseDir . DIRECTORY_SEPARATOR . $safeFilename) : false;

    if (!$baseDir || !$fullPath || strpos($fullPath, $baseDir . DIRECTORY_SEPARATOR) !== 0 || !is_file($fullPath)) {
        http_response_code(404);
        echo 'Sample file missing on disk.';
        exit;
    }

    $update = $pdo->prepare("UPDATE downloads SET download_count = download_count + 1 WHERE id = :id");
    $update->execute([':id' => $id]);

    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . (string)filesize($fullPath));

    readfile($fullPath);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Error serving file.';
    exit;
}