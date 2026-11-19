<?php
declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    sendJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$input = json_decode(file_get_contents('php://input') ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$name = trim((string)($input['name'] ?? ''));
$phone = trim((string)($input['phone'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$topic = trim((string)($input['topic'] ?? 'General Party Support'));
$message = trim((string)($input['message'] ?? ''));

$phoneDigits = preg_replace('/\D+/', '', $phone) ?? '';

if (mb_strlen($name) < 2) {
    sendJson(['ok' => false, 'error' => 'Please enter your name or party name.'], 422);
}

if (strlen($phoneDigits) < 10) {
    sendJson(['ok' => false, 'error' => 'Please enter a valid phone/mobile number (at least 10 digits).'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(['ok' => false, 'error' => 'Please enter a valid email address.'], 422);
}

if (mb_strlen($message) < 5) {
    sendJson(['ok' => false, 'error' => 'Please enter your message (at least 5 characters).'], 422);
}

$fullMessage = "[Topic: {$topic}]\n{$message}";

try {
    $stmt = $pdo->prepare(
        "INSERT INTO inquiries (inquiry_type, name, phone, email, message)
         VALUES ('contact', :name, :phone, :email, :message)"
    );
    $stmt->execute([
        ':name' => $name,
        ':phone' => $phone,
        ':email' => $email,
        ':message' => $fullMessage,
    ]);

    sendJson([
        'ok' => true,
        'id' => (int)$pdo->lastInsertId(),
        'message' => 'Your enquiry has been submitted to Farlex Pharmaceuticals support.',
    ], 201);
} catch (Throwable $e) {
    sendJson(['ok' => false, 'error' => 'Could not save enquiry: ' . $e->getMessage()], 500);
}