<?php
declare(strict_types=1);

session_start();
require_once __DIR__ . '/config/db.php';

function normalizePhone(string $raw): string
{
    $digits = preg_replace('/\D+/', '', $raw) ?? '';
    if (strlen($digits) > 10 && str_starts_with($digits, '91')) {
        $digits = substr($digits, -10);
    } elseif (strlen($digits) === 11 && str_starts_with($digits, '0')) {
        $digits = substr($digits, 1);
    }
    return $digits;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $action = (string)($_GET['action'] ?? 'status');
    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool)$params['secure'], (bool)$params['httponly']);
        }
        session_destroy();
        sendJson(['ok' => true, 'logged_in' => false, 'message' => 'Logged out successfully.']);
    }

    sendJson([
        'ok' => true,
        'logged_in' => !empty($_SESSION['pf_customer']),
        'customer' => $_SESSION['pf_customer'] ?? null,
    ]);
}

if ($method !== 'POST') {
    sendJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$input = json_decode(file_get_contents('php://input') ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$action = trim((string)($input['action'] ?? 'customer_login'));

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    sendJson(['ok' => true, 'logged_in' => false, 'message' => 'Logged out.']);
}

$phoneInput = trim((string)($input['phone'] ?? ''));
$normalized = normalizePhone($phoneInput);

if (strlen($normalized) < 10) {
    sendJson(['ok' => false, 'error' => 'Please enter a valid 10-digit mobile number.'], 422);
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, marg_code, party_name, phone_normalized, city, is_active
         FROM marg_parties
         WHERE phone_normalized = :phone
         LIMIT 1"
    );
    $stmt->execute([':phone' => $normalized]);
    $party = $stmt->fetch();

    if (!$party) {
        sendJson([
            'ok' => false,
            'error' => 'This number is not registered in existing Marg parties. Only existing buying parties can log in.',
        ], 403);
    }

    if ((int)$party['is_active'] !== 1) {
        sendJson([
            'ok' => false,
            'error' => 'This party account is currently inactive. Contact support.',
        ], 403);
    }

    $_SESSION['pf_customer'] = [
        'id' => (int)$party['id'],
        'marg_code' => $party['marg_code'],
        'party_name' => $party['party_name'],
        'phone' => $party['phone_normalized'],
        'city' => $party['city'],
        'role' => 'customer',
    ];

    sendJson([
        'ok' => true,
        'logged_in' => true,
        'customer' => $_SESSION['pf_customer'],
        'message' => 'Welcome, ' . $party['party_name'],
    ]);
} catch (Throwable $e) {
    sendJson(['ok' => false, 'error' => 'Authentication error: ' . $e->getMessage()], 500);
}