import React, { useRef, useState } from 'react';
import { useMongoDatabase } from '../../../context/MongoDatabaseContext';
import { X, HardDrive, Download, Upload, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface MongoDatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoDatabaseManagerModal: React.FC<MongoDatabaseManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    dbName,
    renameDatabase,
    switchDatabase,
    createNewDatabase,
    deleteDatabase,
    savedDatabases,
    exportDatabaseJson,
    importDatabaseJson,
  } = useMongoDatabase();

  const [newDbNameInput, setNewDbNameInput] = useState('');
  const [renameInput, setRenameInput] = useState(dbName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const success = await renameDatabase(renameInput);
    if (success) {
      setFeedback({ type: 'success', message: 'Nombre de base de datos cambiado correctamente.' });
      setIsRenaming(false);
    } else {
      setFeedback({ type: 'error', message: 'No se pudo cambiar el nombre.' });
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const success = await createNewDatabase(newDbNameInput);
    if (success) {
      setFeedback({ type: 'success', message: `Base de datos "${newDbNameInput}" creada.` });
      setNewDbNameInput('');
      setIsCreatingNew(false);
    } else {
      setFeedback({ type: 'error', message: 'Error al crear la base de datos.' });
    }
  };

  const handleExport = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dbName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importDatabaseJson(content);
      if (success) {
        setFeedback({ type: 'success', message: 'Base de datos MongoDB importada exitosamente.' });
      } else {
        setFeedback({ type: 'error', message: 'Archivo JSON inválido o corrupto.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Gestión de Bases de Datos MongoDB</h3>
              <p className="text-xs text-slate-400">Administra bases locales, backups en JSON y cambio de entorno</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className={`p-3 border text-xs rounded-xl flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current Active DB */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Activa:</span>
              <h4 className="text-base font-bold text-emerald-400">{dbName}</h4>
            </div>
            {!isRenaming && (
              <button
                onClick={() => { setRenameInput(dbName); setIsRenaming(true); }}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Renombrar
              </button>
            )}
          </div>

          {isRenaming && (
            <form onSubmit={handleRename} className="flex gap-2">
              <input
                type="text"
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
              />
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg">Guardar</button>
              <button type="button" onClick={() => setIsRenaming(false)} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg">Cancelar</button>
            </form>
          )}
        </div>

        {/* Quick Actions: Export / Import */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition space-y-1"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Download className="w-4 h-4" />
              <span>Exportar JSON</span>
            </div>
            <p className="text-[11px] text-slate-400">Descarga un backup JSON con todas las colecciones.</p>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition space-y-1"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Upload className="w-4 h-4" />
              <span>Importar JSON</span>
            </div>
            <p className="text-[11px] text-slate-400">Carga un archivo JSON exportado previamente.</p>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </div>

        {/* Saved Databases List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bases de datos en este dispositivo:</span>
            {!isCreatingNew && (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Base</span>
              </button>
            )}
          </div>

          {isCreatingNew && (
            <form onSubmit={handleCreateNew} className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre de la nueva base"
                value={newDbNameInput}
                onChange={e => setNewDbNameInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
              />
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg">Crear</button>
              <button type="button" onClick={() => setIsCreatingNew(false)} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg">Cancelar</button>
            </form>
          )}

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {savedDatabases.map(name => (
              <div key={name} className="flex items-center justify-between bg-slate-900 border border-slate-700/70 rounded-xl p-3">
                <span className={`text-xs font-semibold ${name === dbName ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {name} {name === dbName && '(Activa)'}
                </span>
                <div className="flex items-center gap-2">
                  {name !== dbName && (
                    <button
                      onClick={() => switchDatabase(name)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition"
                    >
                      Abrir
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`¿Borrar la base de datos "${name}"?`)) deleteDatabase(name);
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
