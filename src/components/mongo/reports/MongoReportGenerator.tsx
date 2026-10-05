import React, { useState } from 'react';
import { useMongoDatabase } from '../../../context/MongoDatabaseContext';
import { FileText, Printer, Layers, Calendar } from 'lucide-react';

export const MongoReportGenerator: React.FC = () => {
  const { collections, engine } = useMongoDatabase();
  const [selectedColl, setSelectedColl] = useState<string>(collections[0]?.name || '');

  const documents = selectedColl ? engine.getCollectionData(selectedColl) : [];
  const fields = documents.length > 0 ? Object.keys(documents[0]) : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/60 p-4 sm:p-6 rounded-2xl border border-slate-700 gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Informes y Reportes (NoSQL)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Genera documentos de salida limpios a partir de tus colecciones MongoDB para exportar a PDF o imprimir.
          </p>
        </div>

        {collections.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedColl}
              onChange={e => setSelectedColl(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              {collections.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <Printer className="w-4 h-4" />
              <span>Exportar a PDF / Imprimir</span>
            </button>
          </div>
        )}
      </div>

      {/* Printable Sheet */}
      {collections.length === 0 ? (
        <div className="py-12 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 print:hidden">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium text-sm">Crea una colección con documentos para generar un informe.</p>
        </div>
      ) : (
        <div className="bg-white text-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-300 shadow-xl max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
          {/* Header del Informe */}
          <div className="border-b-2 border-slate-800 pb-6 mb-6 flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Informe de Base de Datos MongoDB (NoSQL)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Colección: {selectedColl}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Simulador Web de Base de Datos - Tecnicatura en Ciencia de Datos e IA
              </p>
            </div>

            <div className="text-right text-xs text-slate-500">
              <div className="flex items-center gap-1 justify-end font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Fecha: {new Date().toLocaleDateString('es-AR')}</span>
              </div>
              <div className="mt-1">
                Total Registros: <strong className="text-slate-900">{documents.length}</strong>
              </div>
            </div>
          </div>

          {/* Tabla de Documentos */}
          {documents.length === 0 ? (
            <p className="text-slate-500 text-sm italic py-6">La colección está vacía.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100">
                    {fields.map(f => (
                      <th key={f} className="p-2.5 font-bold text-slate-700 uppercase tracking-wider">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((doc, idx) => (
                    <tr key={doc._id || idx} className="hover:bg-slate-50">
                      {fields.map(f => {
                        const val = doc[f];
                        let rendered = String(val ?? '');
                        if (typeof val === 'object' && val !== null) {
                          rendered = JSON.stringify(val);
                        }
                        return (
                          <td key={f} className="p-2.5 font-mono text-slate-800 break-words max-w-[200px]">
                            {rendered}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer del Informe */}
          <div className="border-t border-slate-200 pt-4 mt-8 text-center text-[10px] text-slate-400">
            Documento generado por MongoWeb Simulator &bull; Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial
          </div>
        </div>
      )}
    </div>
  );
};
