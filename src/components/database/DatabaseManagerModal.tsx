import React, { useRef, useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  X,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck,
  GraduationCap,
  Send
} from 'lucide-react';
import {
  getTelemetryConfig,
  saveTelemetryConfig,
  sendTelemetrySnapshot,
  TelemetryConfig
} from '../../services/telemetry';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isSaving,
    lastSaved,
    tables,
    downloadDatabaseFile,
    importDatabaseFile,
    resetDatabase,
    saveNow,
    exec,
  } = useDatabase();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<TelemetryConfig>(getTelemetryConfig);
  const [isSendingTelemetry, setIsSendingTelemetry] = useState<boolean>(false);
  const [showTelemetrySection, setShowTelemetrySection] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadDatabaseFile();
    setFeedback({
      type: 'success',
      message: 'Descarga iniciada: Se guardó el archivo simulador_base_datos.sqlite en tu dispositivo.',
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await importDatabaseFile(file);
    if (!res.success) {
      setFeedback({
        type: 'error',
        message: res.error || 'No se pudo importar el archivo de base de datos.',
      });
    } else {
      setFeedback({
        type: 'success',
        message: `¡Base de datos restaurada con éxito! Se cargaron ${res.rowsAffected ?? 0} tablas.`,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    await resetDatabase();
    setShowConfirmReset(false);
    setFeedback({
      type: 'success',
      message: 'Base de datos reiniciada. Se ha creado una nueva base en blanco.',
    });
  };

  const handleManualSave = async () => {
    await saveNow();
    setFeedback({
      type: 'success',
      message: 'Base de datos guardada manualmente en el almacenamiento local de este navegador (IndexedDB).',
    });
  };

  const handleSendTelemetry = async () => {
    if (!telemetry.serverUrl) {
      setFeedback({
        type: 'error',
        message: 'Por favor ingresa la URL del servidor docente (ej: http://servidor/api/telemetria.php)',
      });
      return;
    }

    setIsSendingTelemetry(true);
    saveTelemetryConfig(telemetry);

    // Obtener DDL actual de sqlite_master
    const ddlRes = exec("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const ddl = ddlRes.results?.[0]?.values.map((v) => v[0]).join('\n\n') || '';

    const res = await sendTelemetrySnapshot({
      config: telemetry,
      ddl,
      tablesCount: tables.length,
    });

    setIsSendingTelemetry(false);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: '¡Progreso sincronizado exitosamente con el servidor docente!',
      });
    } else {
      setFeedback({
        type: 'error',
        message: `Error al contactar al servidor: ${res.error || 'Verifica la URL'}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-5 sm:p-6 space-y-5">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gestión y Persistencia Local
              </h3>
              <p className="text-xs text-slate-500">
                Almacenamiento en navegador (IndexedDB) y copias .sqlite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2 text-xs animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="leading-relaxed">{feedback.message}</p>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Estado actual de la persistencia */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Estado de auto-guardado:</span>
            {isSaving ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Guardando en IndexedDB...
              </span>
            ) : lastSaved ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Guardado en este navegador
              </span>
            ) : (
              <span className="text-slate-500">Sin cambios pendientes</span>
            )}
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Última sincronización:</span>
            <span className="font-mono text-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {lastSaved ? lastSaved.toLocaleTimeString() : 'Al inicio'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Tablas en memoria:</span>
            <span className="font-semibold text-slate-800">
              {tables.length} {tables.length === 1 ? 'tabla' : 'tablas'}
            </span>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Descargar .sqlite */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-3 p-3 text-left border border-slate-200 hover:border-blue-400 rounded-xl hover:bg-blue-50/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-700">
                Descargar .sqlite
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block">
                Copia local para respaldo o abrir en DB Browser
              </span>
            </div>
          </button>

          {/* Importar .sqlite */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-3 text-left border border-slate-200 hover:border-indigo-400 rounded-xl hover:bg-indigo-50/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-700">
                Restaurar archivo
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block">
                Cargar un archivo .sqlite o .db previo
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite,.db,application/x-sqlite3"
              onChange={handleFileChange}
              className="hidden"
            />
          </button>

          {/* Guardar Ahora */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-3 p-3 text-left border border-slate-200 hover:border-emerald-400 rounded-xl hover:bg-emerald-50/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block group-hover:text-emerald-700">
                Forzar Guardado
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block">
                Guarda de inmediato el estado en IndexedDB
              </span>
            </div>
          </button>

          {/* Reiniciar Base */}
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-3 p-3 text-left border border-slate-200 hover:border-red-400 rounded-xl hover:bg-red-50/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block group-hover:text-red-700">
                Reiniciar Base
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block">
                Borra todas las tablas y comienza de cero
              </span>
            </div>
          </button>
        </div>

        {/* Modal de confirmación para reiniciar */}
        {showConfirmReset && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>¿Confirmas el reinicio total?</span>
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed">
              Esta acción eliminará permanentemente todas las tablas, relaciones y datos cargados en IndexedDB. No se podrá deshacer a menos que hayas descargado una copia .sqlite.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
              >
                Sí, Reiniciar Todo
              </button>
            </div>
          </div>
        )}

        {/* Sincronización Docente (Opcional - Etapa 8) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowTelemetrySection(!showTelemetrySection)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">
                Sincronización Docente (Opcional)
              </span>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold">
              {showTelemetrySection ? 'Ocultar ▲' : 'Configurar ▼'}
            </span>
          </button>

          {showTelemetrySection && (
            <div className="p-3 bg-white space-y-3 border-t border-slate-200">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Si tu docente habilitó el seguimiento en clase, puedes sincronizar tu progreso (tablas creadas y consultas) ingresando tu nombre y la URL del servidor docente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Tu Nombre o Apodo:
                  </label>
                  <input
                    type="text"
                    value={telemetry.studentName}
                    onChange={(e) => setTelemetry({ ...telemetry, studentName: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    ID Alumno (identificador):
                  </label>
                  <input
                    type="text"
                    value={telemetry.studentId}
                    onChange={(e) => setTelemetry({ ...telemetry, studentId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  URL del Endpoint Docente:
                </label>
                <input
                  type="text"
                  value={telemetry.serverUrl}
                  onChange={(e) => setTelemetry({ ...telemetry, serverUrl: e.target.value })}
                  placeholder="http://servidor-docente/api/telemetria.php"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-700"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  {tables.length} {tables.length === 1 ? 'tabla' : 'tablas'} listas para entregar
                </span>
                <button
                  type="button"
                  onClick={handleSendTelemetry}
                  disabled={isSendingTelemetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSendingTelemetry ? 'Enviando...' : 'Enviar al Docente'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="pt-2 flex justify-end border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
