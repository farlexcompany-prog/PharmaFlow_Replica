<?php
// api/gifts.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function loadGiftsFromJsonFile(): array
{
    foreach ([
        dirname(__DIR__) . '/public/assets/data/gifts.json',
        __DIR__ . '/../public/assets/data/gifts.json',
        __DIR__ . '/assets/data/gifts.json',
    ] as $path) {
        if (is_file($path)) {
            $decoded = json_decode((string)file_get_contents($path), true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
    }
    return [];
}

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
            if (function_exists('getDBConnection')) {
                $conn = getDBConnection();
                if ($conn instanceof PDO) { $pdo = $conn; break; }
            }
            if (function_exists('db')) {
                $conn = db();
                if ($conn instanceof PDO) { $pdo = $conn; break; }
            }
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

    $stmt = $pdo->query(
        "SELECT `id`, `name`, `image`, `points`, `category`, `description`
         FROM `reward_gifts`
         WHERE `is_active` = 1
         ORDER BY `points` DESC, `id` ASC"
    );
    $gifts = $stmt->fetchAll();

    if (empty($gifts)) {
        $jsonGifts = loadGiftsFromJsonFile();
        if (!empty($jsonGifts)) {
            $ins = $pdo->prepare(
                "INSERT INTO `reward_gifts` (`name`, `image`, `points`, `category`, `description`, `is_active`)
                 VALUES (:name, :image, :points, :category, :description, 1)"
            );
            foreach ($jsonGifts as $g) {
                $name = trim((string)($g['name'] ?? ''));
                if ($name === '') continue;
                $ins->execute([
                    ':name' => $name,
                    ':image' => (string)($g['image'] ?? ''),
                    ':points' => max(0, (int)($g['points'] ?? 0)),
                    ':category' => trim((string)($g['category'] ?? 'Home Appliances')),
                    ':description' => trim((string)($g['description'] ?? '')),
                ]);
            }
            $gifts = $pdo->query(
                "SELECT `id`, `name`, `image`, `points`, `category`, `description`
                 FROM `reward_gifts`
                 WHERE `is_active` = 1
                 ORDER BY `points` DESC, `id` ASC"
            )->fetchAll();
        }
    }

    echo json_encode(['ok' => true, 'gifts' => $gifts], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    $fallback = loadGiftsFromJsonFile();
    if (!empty($fallback)) {
        http_response_code(200);
        echo json_encode([
            'ok' => true,
            'source' => 'json_fallback',
            'gifts' => $fallback,
            'db_note' => $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}