<?php
/**
 * Endpoint de Telemetría Docente para Simulador Web de Base de Datos
 * Recibe periódicamente un snapshot del progreso del alumno.
 * Compatible con Apache / PHP 7.4+ y 8.x con SQLite o MySQL (PDO).
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Responder a pre-flight request de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido. Use POST."]);
    exit();
}

// Leer cuerpo JSON
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || empty($data['alumno_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Payload inválido o alumno_id ausente."]);
    exit();
}

// Conexión a la base de datos (por defecto SQLite local sin configuración externa)
$dbFile = __DIR__ . '/../telemetria.sqlite';
try {
    $pdo = new PDO("sqlite:" . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Inicializar tabla SQLite si no existe
    $pdo->exec("CREATE TABLE IF NOT EXISTS telemetria_alumnos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alumno_id TEXT NOT NULL UNIQUE,
        alumno_nombre TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ddl_actual TEXT,
        resumen_tablas INTEGER DEFAULT 0,
        resumen_datos TEXT,
        ultima_consulta TEXT,
        ip_origen TEXT
    )");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error de conexión BD: " . $e->getMessage()]);
    exit();
}

// Extraer campos
$alumnoId = trim($data['alumno_id']);
$alumnoNombre = isset($data['alumno_nombre']) ? trim($data['alumno_nombre']) : $alumnoId;
$ddlActual = isset($data['ddl_actual']) ? $data['ddl_actual'] : '';
$resumenTablas = isset($data['resumen_tablas']) ? intval($data['resumen_tablas']) : 0;
$resumenDatos = isset($data['resumen_datos']) ? (is_string($data['resumen_datos']) ? $data['resumen_datos'] : json_encode($data['resumen_datos'])) : '';
$ultimaConsulta = isset($data['ultima_consulta']) ? $data['ultima_consulta'] : '';
$ipOrigen = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

try {
    // Insertar o actualizar (UPSERT)
    $stmt = $pdo->prepare("
        INSERT INTO telemetria_alumnos (alumno_id, alumno_nombre, timestamp, ddl_actual, resumen_tablas, resumen_datos, ultima_consulta, ip_origen)
        VALUES (:alumno_id, :alumno_nombre, datetime('now', 'localtime'), :ddl, :tablas, :datos, :consulta, :ip)
        ON CONFLICT(alumno_id) DO UPDATE SET
            alumno_nombre = excluded.alumno_nombre,
            timestamp = datetime('now', 'localtime'),
            ddl_actual = excluded.ddl_actual,
            resumen_tablas = excluded.resumen_tablas,
            resumen_datos = excluded.resumen_datos,
            ultima_consulta = excluded.ultima_consulta,
            ip_origen = excluded.ip_origen
    ");

    $stmt->execute([
        ':alumno_id' => $alumnoId,
        ':alumno_nombre' => $alumnoNombre,
        ':ddl' => $ddlActual,
        ':tablas' => $resumenTablas,
        ':datos' => $resumenDatos,
        ':consulta' => $ultimaConsulta,
        ':ip' => $ipOrigen
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Progreso sincronizado con éxito.",
        "timestamp" => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error al guardar telemetría: " . $e->getMessage()]);
}
