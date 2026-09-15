import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { EntityWizard } from './EntityWizard';
import { ViewDdlModal } from './ViewDdlModal';
import { AddColumnModal } from './AddColumnModal';
import {
  Table as TableIcon,
  Plus,
  Trash2,
  Code2,
  Key,
  Link as LinkIcon,
  Sparkles,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

export const EntityDesigner: React.FC = () => {
  const { tables, getTableInfo, getTableDdl, deleteTable, exec, refreshTables } = useDatabase();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTableForDdl, setSelectedTableForDdl] = useState<string | null>(null);
  const [selectedTableForAddCol, setSelectedTableForAddCol] = useState<string | null>(null);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Confirmar eliminación de tabla
  const handleConfirmDelete = () => {
    if (!tableToDelete) return;
    const res = deleteTable(tableToDelete);
    if (!res.success) {
      setActionError(res.error || 'Error al eliminar la tabla.');
    } else {
      setActionSuccess(`Tabla "${tableToDelete}" eliminada correctamente.`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
    setTableToDelete(null);
  };

  // Cargar ejemplo educativo (Carreras y Alumnos con FK)
  const handleLoadPreset = () => {
    setActionError(null);
    const sql = `
      CREATE TABLE Carreras (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        duracion_anios INTEGER NOT NULL
      );

      CREATE TABLE Alumnos (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL,
        fecha_ingreso DATE,
        id_carrera INTEGER NOT NULL,
        FOREIGN KEY (id_carrera) REFERENCES Carreras(id)
      );
    `;
    const res = exec(sql);
    if (!res.success) {
      setActionError(res.error || 'Error al cargar el esquema de ejemplo.');
    } else {
      refreshTables();
      setActionSuccess('¡Esquema de ejemplo (Carreras y Alumnos con FK) creado con éxito!');
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  if (isCreating) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <EntityWizard
          onCancel={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            setActionSuccess('¡Entidad creada y registrada en SQLite!');
            setTimeout(() => setActionSuccess(null), 3000);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Notificaciones */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-blue-600" />
            Diseñador de Entidades (Tablas)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Modela visualmente tus entidades, define atributos, claves primarias y relaciones entre tablas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tables.length === 0 && (
            <button
              onClick={handleLoadPreset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
              title="Carga dos tablas relacionadas (Carreras y Alumnos)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cargar Ejemplo Didáctico</span>
            </button>
          )}

          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Entidad</span>
          </button>
        </div>
      </div>

      {/* Listado de Tablas o Estado Vacío */}
      {tables.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Tu base de datos está vacía</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Comienza diseñando tu primera entidad mediante el asistente guiado paso a paso, o carga un esquema de ejemplo preconfigurado.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Entidad</span>
            </button>
            <button
              onClick={handleLoadPreset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cargar Ejemplo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tables.map((tName) => {
            const info = getTableInfo(tName);
            const cols = info?.columns || [];
            const fks = info?.foreignKeys || [];

            return (
              <div
                key={tName}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                {/* Cabecera de la tarjeta */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-mono font-bold text-sm text-slate-900">{tName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                      {cols.length} {cols.length === 1 ? 'columna' : 'columnas'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedTableForDdl(tName)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver DDL (CREATE TABLE)"
                    >
                      <Code2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTableToDelete(tName)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar tabla (DROP TABLE)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Columnas de la tabla */}
                <div className="p-4 flex-1">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="pb-2">Columna</th>
                          <th className="pb-2">Tipo</th>
                          <th className="pb-2">Claves / Restricciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-mono">
                        {cols.map((c) => (
                          <tr key={c.name} className="hover:bg-slate-50/50">
                            <td className="py-2 text-slate-800 font-bold pr-2">{c.name}</td>
                            <td className="py-2 text-slate-600 pr-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100">
                                {c.type}
                              </span>
                            </td>
                            <td className="py-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {c.isPrimaryKey && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 font-sans">
                                    <Key className="w-2.5 h-2.5" />
                                    PK
                                  </span>
                                )}
                                {!c.isNullable && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-sans">
                                    NN
                                  </span>
                                )}
                                {c.isForeignKey && c.foreignKeyTable && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-sans" title={`Apunta a ${c.foreignKeyTable}.${c.foreignKeyColumn}`}>
                                    <LinkIcon className="w-2.5 h-2.5" />
                                    FK → {c.foreignKeyTable}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Detalle de relaciones */}
                  {fks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <span className="font-semibold text-slate-700 block">Relaciones salientes:</span>
                      {fks.map((fk, idx) => (
                        <div key={idx} className="flex items-center gap-1 font-mono text-blue-700">
                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                          <span>{tName}.{fk.columnName}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold">{fk.targetTable}.{fk.targetColumn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pie de la tarjeta */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setSelectedTableForAddCol(tName)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Columna</span>
                  </button>

                  <button
                    onClick={() => setSelectedTableForDdl(tName)}
                    className="text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Ver DDL
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ver DDL */}
      {selectedTableForDdl && (
        <ViewDdlModal
          tableName={selectedTableForDdl}
          ddl={getTableDdl(selectedTableForDdl) || '-- No se encontró sentencia DDL'}
          isOpen={true}
          onClose={() => setSelectedTableForDdl(null)}
        />
      )}

      {/* Modal Agregar Columna */}
      {selectedTableForAddCol && (
        <AddColumnModal
          tableName={selectedTableForAddCol}
          isOpen={true}
          onClose={() => setSelectedTableForAddCol(null)}
          onSuccess={() => {
            refreshTables();
            setActionSuccess('¡Columna agregada exitosamente!');
            setTimeout(() => setActionSuccess(null), 3000);
          }}
        />
      )}

      {/* Modal Confirmar Eliminación */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">¿Eliminar Tabla?</h3>
                <p className="text-xs text-slate-500 font-mono">DROP TABLE "{tableToDelete}";</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción eliminará la tabla y todos los registros almacenados en ella. Si otras tablas tienen una clave foránea referenciando a <span className="font-bold font-mono">"{tableToDelete}"</span>, SQLite podría rechazar la operación por integridad referencial.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Sí, Eliminar Tabla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
