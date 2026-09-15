/**
 * Servicio de Telemetría Docente (Opcional - Etapa 8)
 * Envía snapshots del progreso del alumno al servidor docente.
 */

export interface TelemetryConfig {
  studentId: string;
  studentName: string;
  serverUrl: string;
  autoSync: boolean;
}

const STORAGE_KEY = 'sqlweb_telemetry_config';

export function getTelemetryConfig(): TelemetryConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error al leer config de telemetría:', e);
  }

  // Generar un ID de alumno amigable por defecto
  const randomId = 'estudiante-' + Math.random().toString(36).substring(2, 6);
  return {
    studentId: randomId,
    studentName: '',
    serverUrl: '',
    autoSync: false,
  };
}

export function saveTelemetryConfig(config: TelemetryConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error al guardar config de telemetría:', e);
  }
}

export async function sendTelemetrySnapshot(params: {
  config: TelemetryConfig;
  ddl: string;
  tablesCount: number;
  lastQuery?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { config, ddl, tablesCount, lastQuery } = params;

  if (!config.serverUrl) {
    return { success: false, error: 'URL del servidor no configurada' };
  }

  try {
    const payload = {
      alumno_id: config.studentId,
      alumno_nombre: config.studentName || config.studentId,
      ddl_actual: ddl,
      resumen_tablas: tablesCount,
      ultima_consulta: lastQuery || '',
    };

    const res = await fetch(config.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return { success: data.success ?? true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de red al sincronizar' };
  }
}
