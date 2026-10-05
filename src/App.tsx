import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';

// SQL Imports
import { DatabaseProvider as SqlDatabaseProvider, useDatabase as useSqlDatabase } from './context/SqlDatabaseContext';
import { EntityDesigner } from './components/sql/entities/EntityDesigner';
import { DataEntryForms } from './components/sql/forms/DataEntryForms';
import { QueriesView } from './components/sql/queries/QueriesView';
import { ReportGenerator } from './components/sql/reports/ReportGenerator';
import { DatabaseManagerModal as SqlDatabaseManagerModal } from './components/sql/database/DatabaseManagerModal';
import { TestPanel } from './components/TestPanel';

// Mongo Imports
import { MongoDatabaseProvider, useMongoDatabase } from './context/MongoDatabaseContext';
import { CollectionDesigner } from './components/mongo/collections/CollectionDesigner';
import { DocumentCrudForms } from './components/mongo/documents/DocumentCrudForms';
import { MongoQueriesView } from './components/mongo/queries/MongoQueriesView';
import { MongoReportGenerator } from './components/mongo/reports/MongoReportGenerator';
import { MongoDatabaseManagerModal } from './components/mongo/database/MongoDatabaseManagerModal';

import {
  Database,
  Leaf,
  HardDrive,
  Table,
  FileText,
  Code2,
  BarChart2,
  Cpu,
  Pencil,
  Check,
  Home,
  Layers,
  Sparkles,
  FileJson,
  Printer
} from 'lucide-react';

type ModeType = 'landing' | 'sql' | 'mongo';
type SqlTabType = 'entities' | 'forms' | 'sql' | 'reports' | 'test';
type MongoTabType = 'collections' | 'documents' | 'queries' | 'reports';

// ==========================================
// SQL APP CONTAINER
// ==========================================
const SqlAppHeader: React.FC<{ onOpenDbManager: () => void; onGoHome: () => void }> = ({ onOpenDbManager, onGoHome }) => {
  const { isSaving, lastSaved, dbName, setDbName } = useSqlDatabase();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(dbName);

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await setDbName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Volver a selección de paradigma"
          >
            <Home className="w-4 h-4 text-slate-600" />
            <span className="hidden xs:inline">Inicio</span>
          </button>

          <div className="w-[1px] h-6 bg-slate-300 mx-1 hidden sm:block" />

          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded focus:outline-none text-slate-900"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="p-1 bg-indigo-600 text-white rounded">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <h1 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5 group">
                  <span>{dbName || 'Simulador SQL'}</span>
                  <button onClick={() => setIsEditingName(true)} className="p-1 text-slate-400 hover:text-indigo-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </h1>
              )}
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-indigo-100 text-indigo-800 rounded">
                SQL.js (WASM)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Paradigma Relacional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDbManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">
              {isSaving ? 'Guardando...' : lastSaved ? 'Guardado local' : 'Almacenamiento'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

const SqlAppContainer: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  const [activeTab, setActiveTab] = useState<SqlTabType>('entities');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  return (
    <SqlDatabaseProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <SqlAppHeader onOpenDbManager={() => setIsDbModalOpen(true)} onGoHome={onGoHome} />

        {/* Desktop Tabs */}
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 hidden sm:block print:hidden w-full">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-medium border-b border-slate-200">
            <button
              onClick={() => setActiveTab('entities')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'entities' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>1. Entidades (Tablas)</span>
            </button>

            <button
              onClick={() => setActiveTab('forms')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'forms' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. Formularios de Carga</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'sql' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>3. Consultas (SQL)</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>4. Informes / Reportes</span>
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'test' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>0. Consola WASM</span>
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full">
          {activeTab === 'entities' && <EntityDesigner />}
          {activeTab === 'forms' && <DataEntryForms onNavigateToEntities={() => setActiveTab('entities')} />}
          {activeTab === 'sql' && <QueriesView onNavigateToEntities={() => setActiveTab('entities')} />}
          {activeTab === 'reports' && <ReportGenerator onNavigateToEntities={() => setActiveTab('entities')} />}
          {activeTab === 'test' && <TestPanel />}
        </main>

        <SqlDatabaseManagerModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
      </div>
    </SqlDatabaseProvider>
  );
};

// ==========================================
// MONGO APP CONTAINER
// ==========================================
const MongoAppHeader: React.FC<{ onOpenDbManager: () => void; onGoHome: () => void }> = ({ onOpenDbManager, onGoHome }) => {
  const { dbName, isSaving } = useMongoDatabase();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 print:hidden text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Volver a selección de paradigma"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span className="hidden xs:inline">Inicio</span>
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1 hidden sm:block" />

          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white leading-tight">
                {dbName || 'Simulador Mongo'}
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                Mingo NoSQL Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">
              Paradigma Documental
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDbManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {isSaving ? 'Guardando...' : 'Gestión Mongo DB'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

const MongoAppContainer: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  const [activeTab, setActiveTab] = useState<MongoTabType>('collections');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  return (
    <MongoDatabaseProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-100">
        <MongoAppHeader onOpenDbManager={() => setIsDbModalOpen(true)} onGoHome={onGoHome} />

        {/* Desktop Tabs */}
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 hidden sm:block print:hidden w-full">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-medium border-b border-slate-800">
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'collections' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Colecciones</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'documents' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>2. Carga CRUD Documentos</span>
            </button>

            <button
              onClick={() => setActiveTab('queries')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'queries' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. Aggregation Pipelines & mongosh</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition font-semibold ${
                activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>4. Informes NoSQL</span>
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full">
          {activeTab === 'collections' && <CollectionDesigner />}
          {activeTab === 'documents' && <DocumentCrudForms />}
          {activeTab === 'queries' && <MongoQueriesView />}
          {activeTab === 'reports' && <MongoReportGenerator />}
        </main>

        <MongoDatabaseManagerModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
      </div>
    </MongoDatabaseProvider>
  );
};

// ==========================================
// MAIN APP ROUTER
// ==========================================
export const App: React.FC = () => {
  const [mode, setMode] = useState<ModeType>('landing');

  if (mode === 'landing') {
    return <LandingPage onSelectMode={m => setMode(m)} />;
  }

  if (mode === 'sql') {
    return <SqlAppContainer onGoHome={() => setMode('landing')} />;
  }

  return <MongoAppContainer onGoHome={() => setMode('landing')} />;
};

export default App;
