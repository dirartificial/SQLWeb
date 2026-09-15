<?php
/**
 * Panel Docente de Supervisión en Tiempo Real
 * Muestra el avance y DDL de los alumnos de la Tecnicatura en Ciencia de Datos e IA.
 */

$dbFile = __DIR__ . '/../telemetria.sqlite';
$alumnos = [];
$errorMsg = null;

if (file_exists($dbFile)) {
    try {
        $pdo = new PDO("sqlite:" . $dbFile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->query("SELECT * FROM telemetria_alumnos ORDER BY timestamp DESC");
        $alumnos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $errorMsg = $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Docente • Simulador de Base de Datos</title>
    <!-- Tailwind CSS CDN para vista docente autónoma -->
    <script src="https://cdn.tailwindcss.com"></script>
    <meta http-equiv="refresh" content="15">
</head>
<body class="bg-slate-100 min-h-screen text-slate-800 font-sans">
    <header class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
                <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">📊</span>
                    Supervisión Docente en Tiempo Real
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">Tecnicatura Superior en Ciencia de Datos e IA • Auto-refresco cada 15s</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <?= count($alumnos) ?> Alumnos Registrados
                </span>
                <button onclick="location.reload()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-300">
                    Actualizar ahora
                </button>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <?php if ($errorMsg): ?>
            <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs mb-6">
                Error al cargar la base de datos de telemetría: <?= htmlspecialchars($errorMsg) ?>
            </div>
        <?php endif; ?>

        <?php if (empty($alumnos)): ?>
            <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-xl mb-3">🎓</div>
                <h3 class="text-base font-bold text-slate-800">Aún no hay actividad de alumnos registrada</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Cuando los alumnos comiencen a interactuar con el simulador web y sincronicen su progreso, aparecerán listados aquí con su esquema DDL y consultas.
                </p>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <?php foreach ($alumnos as $a): 
                    $hasFk = stripos($a['ddl_actual'] ?? '', 'FOREIGN KEY') !== false;
                ?>
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div class="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                            <div>
                                <h2 class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    <span><?= htmlspecialchars($a['alumno_nombre'] ?: $a['alumno_id']) ?></span>
                                </h2>
                                <span class="text-[11px] text-slate-400 font-mono">ID: <?= htmlspecialchars($a['alumno_id']) ?></span>
                            </div>
                            <span class="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                                <?= htmlspecialchars(substr($a['timestamp'], 11, 8)) ?>
                            </span>
                        </div>

                        <!-- Indicadores de avance -->
                        <div class="grid grid-cols-2 gap-2 my-3">
                            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                                <span class="text-[10px] text-slate-400 block uppercase font-bold">Tablas DDL</span>
                                <span class="text-base font-extrabold text-blue-600"><?= intval($a['resumen_tablas']) ?></span>
                            </div>
                            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                                <span class="text-[10px] text-slate-400 block uppercase font-bold">Relación FK</span>
                                <span class="text-xs font-bold inline-flex items-center gap-1 mt-0.5 <?= $hasFk ? 'text-emerald-600' : 'text-amber-600' ?>">
                                    <?= $hasFk ? '✓ Conectadas' : '✗ Sin FK' ?>
                                </span>
                            </div>
                        </div>

                        <!-- Última consulta SQL -->
                        <?php if (!empty($a['ultima_consulta'])): ?>
                            <div class="mb-3">
                                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Última consulta:</span>
                                <pre class="bg-slate-900 text-emerald-400 p-2.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-24 whitespace-pre-wrap leading-relaxed"><?= htmlspecialchars($a['ultima_consulta']) ?></pre>
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- Botón para ver DDL Completo -->
                    <details class="mt-2 text-xs">
                        <summary class="cursor-pointer text-blue-600 hover:text-blue-800 font-semibold py-1 select-none flex items-center justify-between">
                            <span>Ver Esquema DDL Completo</span>
                            <span class="text-[10px] text-slate-400">▼</span>
                        </summary>
                        <pre class="mt-2 bg-slate-50 text-slate-700 p-3 rounded-xl border border-slate-200 font-mono text-[10px] overflow-x-auto max-h-48 whitespace-pre"><?= htmlspecialchars($a['ddl_actual'] ?: '-- Sin tablas creadas') ?></pre>
                    </details>
                </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </main>
</body>
</html>
