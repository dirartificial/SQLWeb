import React, { useState } from 'react';
import { useMongoDatabase } from '../../../context/MongoDatabaseContext';
import { Wand2, Code, Play, Trash2, AlertCircle, Sparkles, Layers, FileJson, Clock } from 'lucide-react';
import { MongoExecutionResult } from '../../../types/mongo';

export const MongoQueriesView: React.FC = () => {
  const { collections, runFindQuery, runAggregationPipeline } = useMongoDatabase();
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'mongosh'>('pipeline');
  const [selectedColl, setSelectedColl] = useState<string>(collections[0]?.name || '');

  // Pipeline Builder State
  const [stages, setStages] = useState<Array<{ type: string; query: string }>>([
    { type: '$match', query: '{\n  "activo": true\n}' },
    { type: '$group', query: '{\n  "_id": "$ciudad",\n  "totalAlumnos": { "$sum": 1 }\n}' }
  ]);

  // mongosh State
  const [mongoshCode, setMongoshCode] = useState<string>(
    'db.clientes.find({ "activo": true })'
  );

  const [queryResult, setQueryResult] = useState<MongoExecutionResult | null>(null);

  const handleAddStage = (type: string) => {
    let defaultQuery = '{}';
    if (type === '$match') defaultQuery = '{\n  "campo": "valor"\n}';
    if (type === '$group') defaultQuery = '{\n  "_id": "$campo",\n  "conteo": { "$sum": 1 }\n}';
    if (type === '$project') defaultQuery = '{\n  "nombre": 1,\n  "email": 1\n}';
    if (type === '$unwind') defaultQuery = '"$items"';
    if (type === '$sort') defaultQuery = '{\n  "conteo": -1\n}';
    if (type === '$lookup') defaultQuery = '{\n  "from": "pedidos",\n  "localField": "email",\n  "foreignField": "cliente_email",\n  "as": "mis_pedidos"\n}';

    setStages([...stages, { type, query: defaultQuery }]);
  };

  const handleRemoveStage = (idx: number) => {
    setStages(stages.filter((_, i) => i !== idx));
  };

  const handleRunPipeline = () => {
    try {
      const parsedPipeline = stages.map(s => {
        const val = JSON.parse(s.query);
        return { [s.type]: val };
      });
      const res = runAggregationPipeline(selectedColl, parsedPipeline);
      setQueryResult(res);
    } catch (err: any) {
      setQueryResult({
        success: false,
        error: `Error de sintaxis en alguna etapa: ${err.message}`
      });
    }
  };

  const handleRunMongosh = () => {
    try {
      const code = mongoshCode.trim();
      // Simple parser for db.collection.find(filter, projection) or db.collection.aggregate(pipeline)
      const findMatch = code.match(/^db\.([a-zA-Z0-9_]+)\.find\((.*?)\)$/s);
      const aggMatch = code.match(/^db\.([a-zA-Z0-9_]+)\.aggregate\((.*?)\)$/s);

      if (findMatch) {
        const collName = findMatch[1];
        const argsStr = findMatch[2].trim();
        let filterObj = {};
        let projObj = undefined;

        if (argsStr) {
          const parts = argsStr.split(',{');
          filterObj = JSON.parse(parts[0]);
          if (parts[1]) {
            projObj = JSON.parse('{' + parts[1]);
          }
        }
        const res = runFindQuery(collName, filterObj, projObj);
        setQueryResult(res);
      } else if (aggMatch) {
        const collName = aggMatch[1];
        const pipelineStr = aggMatch[2].trim();
        const pipelineObj = JSON.parse(pipelineStr);
        const res = runAggregationPipeline(collName, pipelineObj);
        setQueryResult(res);
      } else {
        setQueryResult({
          success: false,
          error: 'Sintaxis no reconocida. Usa db.coleccion.find({...}) o db.coleccion.aggregate([...])'
        });
      }
    } catch (err: any) {
      setQueryResult({
        success: false,
        error: `Error al interpretar comando mongosh: ${err.message}`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Selector Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/60 p-4 sm:p-6 rounded-2xl border border-slate-700 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>Consultas y Agregaciones (MongoDB)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Construye pipelines de agregación paso a paso o ejecuta comandos `mongosh` directamente.
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeSubTab === 'pipeline'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Pipeline Builder</span>
          </button>
          <button
            onClick={() => setActiveSubTab('mongosh')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeSubTab === 'mongosh'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Editor mongosh</span>
          </button>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="py-12 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium text-sm">Crea una colección primero para ejecutar consultas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Controls Panel */}
          <div className="lg:col-span-6 bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
            {/* Collection dropdown */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Colección de origen:</label>
              <select
                value={selectedColl}
                onChange={e => setSelectedColl(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {collections.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {activeSubTab === 'pipeline' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Etapas del Aggregation Pipeline:</span>
                  <div className="flex items-center gap-1">
                    {['$match', '$group', '$project', '$unwind', '$sort', '$lookup'].map(st => (
                      <button
                        key={st}
                        onClick={() => handleAddStage(st)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-700 text-emerald-400 font-mono text-[10px] rounded border border-slate-700 transition"
                      >
                        +{st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {stages.map((st, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 font-mono">Stage {idx + 1}: {st.type}</span>
                        <button
                          onClick={() => handleRemoveStage(idx)}
                          className="text-slate-400 hover:text-red-400 text-xs p-1"
                          title="Eliminar etapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={st.query}
                        onChange={e => {
                          const copy = [...stages];
                          copy[idx].query = e.target.value;
                          setStages(copy);
                        }}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRunPipeline}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  <Play className="w-4 h-4" />
                  <span>Ejecutar Aggregation Pipeline</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Comando mongosh (`db.coleccion.find(...)` o `db.coleccion.aggregate(...)`)
                  </label>
                  <textarea
                    rows={8}
                    value={mongoshCode}
                    onChange={e => setMongoshCode(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleRunMongosh}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  <Play className="w-4 h-4" />
                  <span>Ejecutar mongosh</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-6 bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <span>Resultado de la Consulta</span>
              </h3>
              {queryResult?.executionTimeMs !== undefined && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{queryResult.executionTimeMs} ms</span>
                </span>
              )}
            </div>

            {!queryResult ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Haz clic en "Ejecutar" para ver la salida de los documentos JSON o agregaciones.
              </div>
            ) : !queryResult.success ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{queryResult.error}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Documentos devueltos: <strong className="text-emerald-400">{queryResult.count}</strong></span>
                </div>

                {queryResult.stagePreviews && queryResult.stagePreviews.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transformaciones por Etapa (Stage Previews):</span>
                    {queryResult.stagePreviews.map((st, i) => (
                      <details key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300">
                        <summary className="cursor-pointer font-mono text-emerald-400 font-semibold hover:text-emerald-300">
                          {st.stage} ({st.documents.length} docs)
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-950 rounded text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-40">
                          {JSON.stringify(st.documents, null, 2)}
                        </pre>
                      </details>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resultado Final:</span>
                  <pre className="bg-slate-900 p-4 rounded-xl text-emerald-300 font-mono text-xs overflow-x-auto max-h-80 border border-slate-700">
                    {JSON.stringify(queryResult.documents, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
