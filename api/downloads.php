<?php
declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

try {
    $category = trim((string)($_GET['category'] ?? 'All'));
    $search = trim((string)($_GET['q'] ?? ''));

    $sql = "SELECT id, title, description, category, file_path, file_format, file_size_label, download_count, is_sample, created_at
            FROM downloads
            WHERE 1=1";
    $params = [];

    if ($category !== '' && strcasecmp($category, 'All') !== 0) {
        $sql .= " AND category = :category";
        $params[':category'] = $category;
    }

    if ($search !== '') {
        $sql .= " AND (title LIKE :q OR description LIKE :q OR category LIKE :q)";
        $params[':q'] = '%' . $search . '%';
    }

    $sql .= " ORDER BY id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    $catStmt = $pdo->query("SELECT DISTINCT category FROM downloads ORDER BY category ASC");
    $categories = $catStmt->fetchAll(PDO::FETCH_COLUMN);

    sendJson([
        'ok' => true,
        'categories' => array_merge(['All'], $categories),
        'data' => $items,
    ]);
} catch (Throwable $e) {
    sendJson([
        'ok' => false,
        'error' => 'Failed to load downloads: ' . $e->getMessage(),
    ], 500);
}