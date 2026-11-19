

<?php
// public/router.php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Route /api/* to project-root /api/*
if (preg_match('#^/api/(.+\.php)$#', $uri, $matches)) {
    $apiFile = dirname(__DIR__) . '/api/' . $matches[1];
    if (file_exists($apiFile) && is_file($apiFile)) {
        require $apiFile;
        return true;
    }
}

$publicFile = __DIR__ . $uri;
if ($uri !== '/' && file_exists($publicFile) && is_file($publicFile)) {
    return false;
}

require __DIR__ . '/index.php';