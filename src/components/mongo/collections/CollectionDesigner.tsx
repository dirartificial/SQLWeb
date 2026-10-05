import React, { useState } from 'react';
import { useMongoDatabase } from '../../../context/MongoDatabaseContext';
import { Leaf, Plus, Trash2, Code, Layers, FileJson, AlertCircle } from 'lucide-react';

export const CollectionDesigner: React.FC = () => {
  const { collections, createCollection, dropCollection, engine } = useMongoDatabase();
  const [isCreating, setIsCreating] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [selectedColl, setSelectedColl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      createCollection(newCollName);
      setNewCollName('');
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear la colección');
    }
  };

  const handleDrop = (name: string) => {
    if (confirm(`¿Estás seguro de eliminar la colección "${name}"? Se borrarán todos sus documentos.`)) {
      dropCollection(name);
      if (selectedColl === name) setSelectedColl(null);
    }
  };

  const activeDocs = selectedColl ? engine.getCollectionData(selectedColl) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/60 p-4 sm:p-6 rounded-2xl border border-slate-700 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span>Diseñador de Colecciones (NoSQL)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crea colecciones de documentos JSON. A diferencia de SQL, las colecciones son flexibles y aceptan esquemas dinámicos.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Colección</span>
        </button>
      </div>

      {/* Modal Nueva Colección */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Crear Colección</span>
            </h3>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nombre de la Colección
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. usuarios, productos, pedidos"
                  value={newCollName}
                  onChange={e => setNewCollName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition"
                >
                  Crear Colección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de Colecciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
            <FileJson className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium text-sm">No hay colecciones creadas todavía.</p>
            <p className="text-slate-500 text-xs mt-1">Haz clic en "Nueva Colección" para comenzar.</p>
          </div>
        ) : (
          collections.map(coll => (
            <div
              key={coll.name}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                selectedColl === coll.name
                  ? 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white text-base">{coll.name}</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    {coll.count} {coll.count === 1 ? 'doc' : 'docs'}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <p className="text-xs font-medium text-slate-400">Campos detectados en documentos:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-700">
                      _id (objectId)
                    </span>
                    {coll.fields.map(f => (
                      <span key={f.name} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                        {f.name} <span className="text-slate-500">({f.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/60 pt-3 mt-2">
                <button
                  onClick={() => setSelectedColl(selectedColl === coll.name ? null : coll.name)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{selectedColl === coll.name ? 'Ocultar JSON' : 'Ver Documentos JSON'}</span>
                </button>
                <button
                  onClick={() => handleDrop(coll.name)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Eliminar colección"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Inspector Modal / Card */}
      {selectedColl && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span>Documentos en colección: <span className="text-emerald-400">{selectedColl}</span></span>
            </h3>
            <button
              onClick={() => setSelectedColl(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cerrar Vista
            </button>
          </div>

          <pre className="bg-slate-900 p-4 rounded-xl text-emerald-300 font-mono text-xs overflow-x-auto max-h-96 border border-slate-700">
            {JSON.stringify(activeDocs, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
