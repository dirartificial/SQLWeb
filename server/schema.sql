-- Esquema para la Base de Datos del Servidor Docente (MySQL / MariaDB o SQLite)
-- Permite registrar el progreso de cada alumno en tiempo real.

CREATE TABLE IF NOT EXISTS telemetria_alumnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id VARCHAR(100) NOT NULL,
    alumno_nombre VARCHAR(150) NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ddl_actual TEXT,
    resumen_tablas INT DEFAULT 0,
    resumen_datos TEXT,
    ultima_consulta TEXT,
    ip_origen VARCHAR(45) NULL,
    INDEX idx_alumno (alumno_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
