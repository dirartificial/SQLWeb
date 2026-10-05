import React from 'react';
import { Database, Leaf, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onSelectMode: (mode: 'sql' | 'mongo') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between py-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Simulador de Bases de Datos
            </h1>
            <p className="text-xs text-slate-400 font-medium">Tecnicatura Superior en Ciencia de Datos e IA</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ejecución 100% en Navegador (Sin servidor)</span>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-6xl mx-auto w-full my-auto py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Entorno Pedagógico Interactivo
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Selecciona el paradigma de Base de Datos
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Elige el motor con el que deseas practicar hoy. Ambos entornos incluyen diseñador visual, constructor de consultas, carga de datos y reportes.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* SQL Card */}
          <div 
            onClick={() => onSelectMode('sql')}
            className="group relative bg-slate-800/50 hover:bg-slate-800/80 rounded-2xl p-6 sm:p-8 border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-xl hover:shadow-indigo-500/10"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Database className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  Relacional (SQL)
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                Base de Datos Relacional
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Simulador equivalente a LibreOffice Base / SQLite. Diseñado para aprender tablas, claves primarias, claves foráneas, consultas SQL (`JOIN`, `GROUP BY`) e informes.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Diseñador visual de Entidades y relaciones DDL</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Formularios de carga dinámicos con validación FK</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Constructor visual de `SELECT`, `HAVING` y Editor SQL (SQL.js)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Generador de informes agrupados exportable a PDF</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-500/25">
              <span>Iniciar Simulador SQL</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* MongoDB Card */}
          <div 
            onClick={() => onSelectMode('mongo')}
            className="group relative bg-slate-800/50 hover:bg-slate-800/80 rounded-2xl p-6 sm:p-8 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-xl hover:shadow-emerald-500/10"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Documental (NoSQL)
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Base de Datos MongoDB
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Simulador NoSQL orientado a documentos. Diseñado para dominar colecciones, estructuras JSON/BSON, referencias por `ObjectId` y *Aggregation Pipelines*.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Gestor de Colecciones y visualizador de esquemas JSON</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Carga de Documentos (Editor JSON & Formulario interactivo)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Constructor visual de Aggregations (`$match`, `$group`, `$project`, `$lookup`)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Consola de comandos `mongosh` y reporte de datos NoSQL</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-emerald-500/25">
              <span>Iniciar Simulador MongoDB</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-slate-800 text-xs text-slate-500">
        Simulador Web de Base de Datos &copy; {new Date().getFullYear()} &bull; Entorno pedagógico para Ciencia de Datos e Inteligencia Artificial
      </footer>
    </div>
  );
};
