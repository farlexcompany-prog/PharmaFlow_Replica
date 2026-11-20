<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $json = (is_string($raw) && trim($raw) !== '') ? json_decode($raw, true) : null;
    $in = is_array($json) ? $json : $_POST;

    $ledgerName   = trim((string)($in['ledger_name'] ?? $in['partner_name'] ?? ''));
    $partyCode    = trim((string)($in['party_code'] ?? $in['partner_code'] ?? ''));
    $contactNo    = trim((string)($in['contact_no'] ?? $in['phone'] ?? ''));
    $address      = trim((string)($in['address'] ?? ''));
    $selectedGift = trim((string)($in['selected_gift'] ?? $in['gift'] ?? ''));

    if ($ledgerName === '' || $partyCode === '' || $contactNo === '' || $address === '' || $selectedGift === '') {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'error' => 'Please fill Ledger Name, Party code, Contact no, Address, and Selected gift.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

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
                $c = getDBConnection();
                if ($c instanceof PDO) { $pdo = $c; break; }
            }
            if (function_exists('db')) {
                $c = db();
                if ($c instanceof PDO) { $pdo = $c; break; }
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

    $points = max(0, (int)($in['points'] ?? 0));
    $gStmt = $pdo->prepare('SELECT `points` FROM `reward_gifts` WHERE `name` = :name LIMIT 1');
    $gStmt->execute([':name' => $selectedGift]);
    $gRow = $gStmt->fetch();
    if ($gRow && isset($gRow['points'])) {
        $points = (int)$gRow['points'];
    }

    $stmt = $pdo->prepare(
        'INSERT INTO `claims_gifts`
            (`ledger_name`, `party_code`, `contact_no`, `address`, `selected_gift`, `points`, `status`)
         VALUES
            (:ledger_name, :party_code, :contact_no, :address, :selected_gift, :points, :status)'
    );

    $stmt->execute([
        ':ledger_name'   => $ledgerName,
        ':party_code'    => $partyCode,
        ':contact_no'    => $contactNo,
        ':address'       => $address,
        ':selected_gift' => $selectedGift,
        ':points'        => $points,
        ':status'        => 'Pending',
    ]);

    http_response_code(201);
    echo json_encode([
        'ok' => true,
        'claim_id' => (int)$pdo->lastInsertId(),
        'message' => 'Claim submitted successfully.',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}