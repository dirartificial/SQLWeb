import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { TestPanel } from './components/TestPanel';
import { EntityDesigner } from './components/entities/EntityDesigner';
import { DataEntryForms } from './components/forms/DataEntryForms';
import { QueriesView } from './components/sql/QueriesView';
import { DatabaseManagerModal } from './components/database/DatabaseManagerModal';
import { Database, Cpu, Table, FileText, Code2, BarChart2, HardDrive, Pencil, Check } from 'lucide-react';

import { ReportGenerator } from './components/reports/ReportGenerator';

type TabType = 'entities' | 'forms' | 'sql' | 'reports' | 'test';

interface HeaderProps {
  onOpenDbManager: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenDbManager }) => {
  const { isReady, isLoading, initError, isSaving, lastSaved, dbName, setDbName } = useDatabase();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(dbName);

  useEffect(() => {
    setTempName(dbName);
  }, [dbName]);

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await setDbName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setTempName(dbName);
      setIsEditingName(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="px-2 py-0.5 text-xs font-bold border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Guardar nombre"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5 group">
                  <span>{dbName || 'Simulador Base de Datos'}</span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 opacity-70 group-hover:opacity-100 hover:text-blue-600 rounded transition-all"
                    title="Editar nombre de la base de datos"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </h1>
              )}
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-blue-100 text-blue-800 rounded">
                WASM
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Tecnicatura en Ciencia de Datos e IA
            </p>
          </div>
        </div>

        {/* Acciones y Estado del motor SQLite */}
        <div className="flex items-center gap-2">
          {/* Botón de Gestión de BD / Persistencia */}
          <button
            onClick={onOpenDbManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-all active:scale-95"
            title="Gestionar almacenamiento local (IndexedDB) y copias .sqlite"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">
              {isSaving ? 'Guardando...' : lastSaved ? 'Guardado en navegador' : 'Almacenamiento'}
            </span>
          </button>

          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="hidden xs:inline">Cargando SQLite...</span>
            </div>
          ) : initError ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              <span>Error WASM</span>
            </div>
          ) : isReady ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden xs:inline">SQLite Activo</span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

interface NavigationTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 hidden sm:block print:hidden">
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 text-xs font-medium border-b border-slate-200">
        <button
          onClick={() => onSelectTab('entities')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap font-semibold ${
            activeTab === 'entities'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>1. Entidades (Tablas)</span>
        </button>

        <button
          onClick={() => onSelectTab('forms')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap font-semibold ${
            activeTab === 'forms'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>2. Formularios de Carga</span>
        </button>

        <button
          onClick={() => onSelectTab('sql')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap font-semibold ${
            activeTab === 'sql'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>3. Consultas (SQL)</span>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap font-semibold ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>4. Informes / Reportes</span>
        </button>

        <button
          onClick={() => onSelectTab('test')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap font-semibold ${
            activeTab === 'test'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>0. Consola WASM</span>
        </button>
      </div>
    </nav>
  );
};

const BottomNavigation: React.FC<NavigationTabsProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav aria-label="Navegación móvil inferior" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg print:hidden">
      <div className="grid grid-cols-5 gap-0.5">
        <button
          onClick={() => onSelectTab('entities')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
            activeTab === 'entities'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Table className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Tablas</span>
        </button>

        <button
          onClick={() => onSelectTab('forms')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
            activeTab === 'forms'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Carga</span>
        </button>

        <button
          onClick={() => onSelectTab('sql')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
            activeTab === 'sql'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Code2 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Consultas</span>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
            activeTab === 'reports'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <BarChart2 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Reportes</span>
        </button>

        <button
          onClick={() => onSelectTab('test')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
            activeTab === 'test'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Cpu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Motor</span>
        </button>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-12 mb-16 sm:mb-0 text-center text-xs text-slate-500 print:hidden">
      <div className="max-w-6xl mx-auto px-4">
        <p>Simulador Pedagógico de Base de Datos • LibreOffice Base Web • SQLite en WebAssembly</p>
        <p className="mt-1 text-[11px] text-slate-400">Diseñado para celulares, tablets y computadoras • 100% en cliente</p>
      </div>
    </footer>
  );
};

const MainContent: React.FC<{ activeTab: TabType; onSelectTab: (tab: TabType) => void }> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
      {activeTab === 'entities' && <EntityDesigner />}
      {activeTab === 'forms' && <DataEntryForms onNavigateToEntities={() => onSelectTab('entities')} />}
      {activeTab === 'sql' && <QueriesView onNavigateToEntities={() => onSelectTab('entities')} />}
      {activeTab === 'reports' && <ReportGenerator onNavigateToEntities={() => onSelectTab('entities')} />}
      {activeTab === 'test' && <TestPanel />}
    </main>
  );
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('entities');
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);

  return (
    <DatabaseProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Header onOpenDbManager={() => setIsDbModalOpen(true)} />
        <NavigationTabs activeTab={activeTab} onSelectTab={setActiveTab} />
        <div className="flex-1">
          <MainContent activeTab={activeTab} onSelectTab={setActiveTab} />
        </div>
        <Footer />
        <BottomNavigation activeTab={activeTab} onSelectTab={setActiveTab} />
        <DatabaseManagerModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
      </div>
    </DatabaseProvider>
  );
};

export default App;
