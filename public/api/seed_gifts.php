<?php
// api/seed_gifts.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = null;

    foreach ([
        dirname(__DIR__) . '/config/db.php',
        dirname(__DIR__) . '/db.php',
        __DIR__ . '/../config/db.php',
        __DIR__ . '/../db.php',
    ] as $dbFile) {
        if (is_file($dbFile)) {
            require_once $dbFile;
            if (isset($pdo) && $pdo instanceof PDO) break;
            if (function_exists('getDBConnection')) { $pdo = getDBConnection(); break; }
            if (function_exists('db')) { $pdo = db(); break; }
        }
    }

    if (!($pdo instanceof PDO)) {
        $pdo = new PDO(
            'mysql:host=127.0.0.1;port=3306;dbname=pharmaflow_db;charset=utf8mb4',
            'root',
            '',
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }

    $jsonPath = dirname(__DIR__) . '/public/assets/data/gifts.json';
    if (!is_file($jsonPath)) {
        throw new RuntimeException('gifts.json not found at public/assets/data/gifts.json');
    }

    $gifts = json_decode(file_get_contents($jsonPath), true);
    if (!is_array($gifts) || empty($gifts)) {
        throw new RuntimeException('gifts.json is empty or invalid JSON');
    }

    $existingNames = $pdo->query("SELECT `name` FROM `reward_gifts`")->fetchAll(PDO::FETCH_COLUMN);
    $existingMap = array_flip($existingNames);

    $insert = $pdo->prepare(
        "INSERT INTO `reward_gifts` (`name`, `image`, `points`, `category`, `description`, `is_active`)
         VALUES (:name, :image, :points, :category, :description, 1)"
    );

    $inserted = 0;
    foreach ($gifts as $g) {
        $name = trim((string)($g['name'] ?? ''));
        if ($name === '' || isset($existingMap[$name])) {
            continue;
        }
        $insert->execute([
            ':name' => $name,
            ':image' => (string)($g['image'] ?? ''),
            ':points' => max(0, (int)($g['points'] ?? 0)),
            ':category' => trim((string)($g['category'] ?? 'Home Appliances')),
            ':description' => trim((string)($g['description'] ?? '')),
        ]);
        $existingMap[$name] = true;
        $inserted++;
    }

    echo json_encode([
        'ok' => true,
        'inserted' => $inserted,
        'total_in_db' => (int)$pdo->query("SELECT COUNT(*) FROM `reward_gifts`")->fetchColumn(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}