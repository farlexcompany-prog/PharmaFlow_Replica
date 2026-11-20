<?php
// public/api/reminder_pdfs.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$candidates = [
    [
        'dir'    => dirname(__DIR__) . '/pdfs',
        'urlBase'=> 'assets/pdfs/',
    ],
    [
        'dir'    => dirname(__DIR__) . '/assets/pdfs',
        'urlBase'=> 'assets/pdfs/',
    ],

];

$pdfs = [];

foreach ($candidates as $c) {
    if (!is_dir($c['dir'])) {
        continue;
    }

    $files = scandir($c['dir']);
    if ($files === false) {
        continue;
    }

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        $fullPath = $c['dir'] . '/' . $file;
        if (is_file($fullPath) && strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'pdf') {
            $cleanTitle = ucwords(str_replace(['-', '_'], ' ', pathinfo($file, PATHINFO_FILENAME)));
            $pdfs[] = [
                'name'  => $file,
                'title' => $cleanTitle,
                'url'   => $c['urlBase'] . rawurlencode($file),
            ];
        }
    }

    if (!empty($pdfs)) {
        break;
    }
}

echo json_encode([
    'ok'    => true,
    'count' => count($pdfs),
    'pdfs'  => $pdfs,
], JSON_UNESCAPED_UNICODE);