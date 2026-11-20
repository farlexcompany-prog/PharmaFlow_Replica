<?php
// api/products.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$host    = '127.0.0.1';
$db      = 'pharmaflow_db';
$user    = 'root';
$pass    = '';
$charset = 'utf8mb4';



try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=$charset",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $segments = $pdo->query("
        SELECT s.id, s.name, COUNT(ps.product_id) AS product_count
        FROM segments s
        LEFT JOIN product_segments ps ON ps.segment_id = s.id
        GROUP BY s.id, s.name
        ORDER BY s.name ASC
    ")->fetchAll();

    // Support both ?search= and ?q=
    $rawSearch = $_GET['search'] ?? ($_GET['q'] ?? '');
    $search    = trim((string)$rawSearch);
    $segmentId = isset($_GET['segment_id']) && $_GET['segment_id'] !== '' ? (int)$_GET['segment_id'] : 0;
    $page      = max(1, (int)($_GET['page'] ?? 1));
    $perPage   = min(48, max(6, (int)($_GET['per_page'] ?? 12)));
    $offset    = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    if ($search !== '') {
        $where[] = "(
            p.name LIKE :search
            OR p.composition LIKE :search
            OR p.packing LIKE :search
            OR EXISTS (
                SELECT 1 FROM product_segments ps2
                JOIN segments s2 ON s2.id = ps2.segment_id
                WHERE ps2.product_id = p.id AND s2.name LIKE :search
            )
        )";
        $params[':search'] = '%' . $search . '%';
    }

    if ($segmentId > 0) {
        $where[] = "EXISTS (
            SELECT 1 FROM product_segments ps
            WHERE ps.product_id = p.id AND ps.segment_id = :segment_id
        )";
        $params[':segment_id'] = $segmentId;
    }

    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM products p $whereSql");
    foreach ($params as $key => $val) {
        $countStmt->bindValue($key, $val, PDO::PARAM_STR);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $sql = "
        SELECT
            p.id,
            p.sr_no,
            p.name,
            p.composition,
            p.packing,
            p.mrp,
            p.mrp_note,
            p.image_url,
            c.name AS company_name,
            (
                SELECT s.name
                FROM product_segments ps
                JOIN segments s ON s.id = ps.segment_id
                WHERE ps.product_id = p.id
                ORDER BY s.id ASC
                LIMIT 1
            ) AS category_name
        FROM products p
        LEFT JOIN companies c ON c.id = p.company_id
        $whereSql
        ORDER BY p.sr_no IS NULL, p.sr_no ASC, p.id ASC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val, PDO::PARAM_STR);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $products = $stmt->fetchAll();

    echo json_encode([
        'ok'          => true,
        'search'      => $search,
        'products'    => $products,
        'segments'    => $segments,
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => max(1, (int)ceil($total / $perPage)),
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'message' => 'Failed to load products: ' . $e->getMessage(),
    ]);
}