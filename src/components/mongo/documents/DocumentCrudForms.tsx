import React, { useState } from 'react';
import { useMongoDatabase } from '../../../context/MongoDatabaseContext';
import { Save, Trash2, Edit2, FileJson, AlertCircle, CheckCircle2, Layers, Code } from 'lucide-react';
import { MongoDocument } from '../../../types/mongo';

export const DocumentCrudForms: React.FC = () => {
  const { collections, engine, insertDocument, updateDocument, deleteDocument } = useMongoDatabase();
  const [selectedColl, setSelectedColl] = useState<string>(collections[0]?.name || '');
  
  const [jsonText, setJsonText] = useState<string>('{\n  "nombre": "Ejemplo",\n  "activo": true,\n  "etiquetas": ["nuevo", "destacado"]\n}');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const documents = selectedColl ? engine.getCollectionData(selectedColl) : [];

  const handleSaveJson = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        throw new Error('El contenido debe ser un objeto JSON válido.');
      }

      if (editingId) {
        updateDocument(selectedColl, editingId, parsed);
        setSuccess('Documento actualizado correctamente.');
      } else {
        insertDocument(selectedColl, parsed);
        setSuccess('Nuevo documento insertado en la colección.');
      }

      setEditingId(null);
      setJsonText('{\n  "nombre": "",\n  "activo": true\n}');
    } catch (err: any) {
      setError(err.message || 'Error de sintaxis en el JSON.');
    }
  };

  const handleEditClick = (doc: MongoDocument) => {
    setEditingId(doc._id);
    const copy = { ...doc };
    delete (copy as any)._id; // show editable payload
    setJsonText(JSON.stringify(copy, null, 2));
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('¿Deseas eliminar este documento de la colección?')) {
      deleteDocument(selectedColl, id);
      setSuccess('Documento eliminado.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Colección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/60 p-4 sm:p-6 rounded-2xl border border-slate-700 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileJson className="w-5 h-5 text-emerald-400" />
            <span>Gestión de Documentos (CRUD)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inserta, modifica o elimina documentos JSON en tus colecciones MongoDB.
          </p>
        </div>

        {collections.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Colección:</label>
            <select
              value={selectedColl}
              onChange={e => {
                setSelectedColl(e.target.value);
                setEditingId(null);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              {collections.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.count} docs)</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {collections.length === 0 ? (
        <div className="py-12 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium text-sm">Crea una colección primero en el Diseñador de Colecciones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario / Editor JSON */}
          <div className="lg:col-span-5 bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>{editingId ? 'Editar Documento' : 'Insertar Nuevo Documento'}</span>
              </h3>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setJsonText('{\n  "nombre": "",\n  "activo": true\n}');
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveJson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Estructura JSON (Documento BSON)
                </label>
                <textarea
                  rows={8}
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder='{\n  "campo": "valor"\n}'
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Guardar Cambios' : 'Insertar Documento'}</span>
              </button>
            </form>
          </div>

          {/* Grilla / Listado de Documentos */}
          <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Documentos en <span className="text-emerald-400">{selectedColl}</span> ({documents.length})</span>
              </h3>
            </div>

            {documents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No hay documentos en esta colección.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {documents.map((doc, idx) => (
                  <div key={doc._id || idx} className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 space-y-2 relative group hover:border-slate-600 transition">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <span className="font-mono text-[11px] text-emerald-400">_id: "{doc._id}"</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(doc)}
                          className="p-1 hover:text-emerald-400 rounded transition"
                          title="Editar documento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(doc._id)}
                          className="p-1 hover:text-red-400 rounded transition"
                          title="Eliminar documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <pre className="text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
