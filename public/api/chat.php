<?php

function loadEnvValue(string $key, string $default = ''): string
{
    $envVal = getenv($key);
    if ($envVal !== false && $envVal !== '') {
        return $envVal;
    }

    // public/api/chat.php se 2 level upar project root hoti hai (adjust agar path alag ho)
    $envPath = dirname(__DIR__, 2) . '/.env';
    if (!is_readable($envPath)) {
        return $default;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return $default;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2 && trim($parts[0]) === $key) {
            return trim($parts[1], " \t\n\r\0\x0B\"'");
        }
    }

    return $default;
}

$apiKey = loadEnvValue('GEMINI_API_KEY');
if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'GEMINI_API_KEY is missing in .env']);
    exit;
}