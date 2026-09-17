import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  X,
  Edit2,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Table as TableIcon,
  Key,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
  Save
} from 'lucide-react';
import { SqliteDataType, ColumnDefinition } from '../../types/database';

interface EditEntityModalProps {
  tableName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  tableName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    getTableInfo,
    updateTableSchema,
    tables,
    getTableDdl,
  } = useDatabase();

  const info = getTableInfo(tableName);
  const currentColumns = info?.columns || [];

  // Estado local para nombre de tabla
  const [newTableName, setNewTableName] = useState<string>(tableName);

  // Estado local para las columnas (soporta renombrar, cambiar tipo, reordenar, agregar, borrar)
  const [localCols, setLocalCols] = useState<ColumnDefinition[]>(currentColumns);

  // Estado para edición de nombre de columna individual
  const [columnNames, setColumnNames] = useState<Record<string, string>>({});
  const [editingCol, setEditingCol] = useState<string | null>(null);

  // Estado para agregar nueva columna
  const [showAddCol, setShowAddCol] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<SqliteDataType>('TEXT');
  const [newColNotNull, setNewColNotNull] = useState<boolean>(false);

  // Feedback y mensajes
  const [error, setError] = useState<string | null>(null);
  const [colToDelete, setColToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sincronizar columnas al abrir o cambiar de tabla
  useEffect(() => {
    if (info?.columns) {
      setLocalCols(info.columns);
    }
    setNewTableName(tableName);
  }, [tableName, dbVersionState(info)]);

  function dbVersionState(tableInfo: any) {
    return tableInfo?.columns?.map((c: any) => `${c.name}:${c.type}`).join(',') || '';
  }

  if (!isOpen) return null;

  // Reordenar columnas (Subir ▲ / Bajar ▼)
  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...localCols];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCols.length) return;
    const temp = newCols[index];
    newCols[index] = newCols[targetIdx];
    newCols[targetIdx] = temp;
    setLocalCols(newCols);
  };

  // Cambiar tipo de dato de una columna en estado local
  const handleChangeColumnType = (colName: string, newType: SqliteDataType) => {
    setLocalCols((prev) =>
      prev.map((c) => (c.name === colName ? { ...c, type: newType } : c))
    );
  };

  // Guardar cambio de nombre de columna individual
  const handleSaveColumnName = (oldColName: string) => {
    setError(null);
    const targetName = (columnNames[oldColName] ?? oldColName).trim();
    if (!targetName) {
      setError('El nombre de la columna no puede estar vacío.');
      return;
    }
    if (localCols.some((c) => c.name.toLowerCase() === targetName.toLowerCase() && c.name !== oldColName)) {
      setError(`Ya existe una columna llamada "${targetName}" en esta tabla.`);
      return;
    }

    setLocalCols((prev) =>
      prev.map((c) => (c.name === oldColName ? { ...c, name: targetName } : c))
    );
    setEditingCol(null);
  };

  // Eliminar columna de localCols
  const handleConfirmDeleteColumn = () => {
    if (!colToDelete) return;
    if (localCols.length <= 1) {
      setError('Una entidad debe conservar al menos una columna.');
      setColToDelete(null);
      return;
    }
    setLocalCols((prev) => prev.filter((c) => c.name !== colToDelete));
    setColToDelete(null);
  };

  // Agregar nueva columna a localCols
  const handleAddNewColumn = () => {
    setError(null);
    const trimmed = newColName.trim();
    if (!trimmed) {
      setError('Ingresa un nombre para la nueva columna.');
      return;
    }
    if (localCols.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Ya existe una columna llamada "${trimmed}" en esta tabla.`);
      return;
    }

    const colDef: ColumnDefinition = {
      name: trimmed,
      type: newColType,
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable: !newColNotNull,
    };

    setLocalCols((prev) => [...prev, colDef]);
    setNewColName('');
    setNewColNotNull(false);
    setShowAddCol(false);
  };

  // Guardar todos los cambios de estructura en SQLite
  const handleSaveAllChanges = () => {
    setError(null);
    const trimmedTable = newTableName.trim();
    if (!trimmedTable) {
      setError('El nombre de la entidad/tabla no puede estar vacío.');
      return;
    }

    if (
      trimmedTable.toLowerCase() !== tableName.toLowerCase() &&
      tables.some((t) => t.toLowerCase() === trimmedTable.toLowerCase())
    ) {
      setError(`Ya existe una tabla llamada "${trimmedTable}" en la base de datos.`);
      return;
    }

    if (localCols.length === 0) {
      setError('Debes incluir al menos una columna en la tabla.');
      return;
    }

    setIsSaving(true);
    const res = updateTableSchema(tableName, trimmedTable, localCols);
    setIsSaving(false);

    if (!res.success) {
      setError(res.error || 'Error al actualizar la estructura de la tabla.');
    } else {
      onSuccess(`Estructura de la tabla "${trimmedTable}" guardada correctamente.`);
      onClose();
    }
  };

  const ddlSql = getTableDdl(tableName) || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Editar Entidad: <span className="font-mono text-blue-600">{tableName}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Cambia el nombre, tipo de dato y orden de las columnas o agrega nuevos atributos
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

        {/* Notificación de error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-start gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold">×</button>
          </div>
        )}

        <div className="overflow-y-auto space-y-5 pr-1 flex-1 custom-scrollbar">
          {/* 1. Renombrar Tabla */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Nombre de la Entidad (Tabla):
            </label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Nombre de la tabla"
            />
          </div>

          {/* 2. Lista de Columnas: Renombrar, Cambiar Tipo y Reordenar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Atributos y Orden de Columnas ({localCols.length})
              </h4>
              <button
                onClick={() => setShowAddCol(!showAddCol)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddCol ? 'Cancelar' : 'Agregar Columna'}</span>
              </button>
            </div>

            {/* Formulario Agregar Columna Integrado */}
            {showAddCol && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-fade-in text-xs">
                <span className="font-bold text-blue-900 block">Agregar Nuevo Atributo</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Nombre:
                    </label>
                    <input
                      type="text"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      placeholder="Ej: direccion"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Tipo de Dato:
                    </label>
                    <select
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value as SqliteDataType)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                    >
                      <option value="TEXT">TEXT (Texto)</option>
                      <option value="INTEGER">INTEGER (Entero)</option>
                      <option value="REAL">REAL (Decimal)</option>
                      <option value="DATE">DATE (Fecha)</option>
                      <option value="BOOLEAN">BOOLEAN (Booleano)</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={newColNotNull}
                        onChange={(e) => setNewColNotNull(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Obligatorio (NOT NULL)</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleAddNewColumn}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs"
                  >
                    Añadir a la lista
                  </button>
                </div>
              </div>
            )}

            {/* Tabla con reordenamiento (▲/▼) y modificación de tipo */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-2.5 w-12 text-center">Orden</th>
                    <th className="px-3 py-2.5">Nombre Columna</th>
                    <th className="px-3 py-2.5">Tipo de Dato</th>
                    <th className="px-3 py-2.5">Restricciones</th>
                    <th className="px-3 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {localCols.map((col, idx) => {
                    const isEditingThis = editingCol === col.name;
                    const val = columnNames[col.name] ?? col.name;

                    return (
                      <tr key={col.name} className="hover:bg-slate-50/75">
                        {/* 1. Botones de reordenamiento */}
                        <td className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveColumn(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 rounded"
                              title="Subir posición"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveColumn(idx, 'down')}
                              disabled={idx === localCols.length - 1}
                              className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 rounded"
                              title="Bajar posición"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* 2. Nombre de la columna */}
                        <td className="px-3 py-2">
                          {isEditingThis ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  setColumnNames({ ...columnNames, [col.name]: e.target.value })
                                }
                                className="px-2 py-1 border border-blue-400 rounded text-xs font-mono w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveColumnName(col.name)}
                                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                title="Confirmar nuevo nombre"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingCol(null)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-800">{col.name}</span>
                          )}
                        </td>

                        {/* 3. Tipo de dato editable con desplegable */}
                        <td className="px-3 py-2">
                          <select
                            value={col.type}
                            onChange={(e) => handleChangeColumnType(col.name, e.target.value as SqliteDataType)}
                            className="px-2 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="INTEGER">INTEGER</option>
                            <option value="TEXT">TEXT</option>
                            <option value="REAL">REAL</option>
                            <option value="DATE">DATE</option>
                            <option value="BOOLEAN">BOOLEAN</option>
                          </select>
                        </td>

                        {/* 4. Restricciones (PK, NN, FK) */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 font-sans text-[10px]">
                            {col.isPrimaryKey && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                                <Key className="w-2.5 h-2.5" /> PK
                              </span>
                            )}
                            {!col.isNullable && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                NOT NULL
                              </span>
                            )}
                            {col.isForeignKey && col.foreignKeyTable && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800" title={`Apunta a ${col.foreignKeyTable}`}>
                                <LinkIcon className="w-2.5 h-2.5" /> FK → {col.foreignKeyTable}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Acciones */}
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isEditingThis && (
                              <button
                                onClick={() => {
                                  setEditingCol(col.name);
                                  setColumnNames({ ...columnNames, [col.name]: col.name });
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Renombrar nombre de columna"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {localCols.length > 1 && (
                              <button
                                onClick={() => setColToDelete(col.name)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar columna de la lista"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Confirmar eliminación de columna de la lista */}
            {colToDelete && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>¿Quitar columna "{colToDelete}" de la entidad?</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setColToDelete(null)}
                    className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDeleteColumn}
                    className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                  >
                    Sí, Quitar Columna
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DDL Actual en SQLite */}
          <div className="bg-slate-900 rounded-xl p-3 text-slate-100 text-xs font-mono space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Sentencia DDL de la Tabla Original:
            </span>
            <pre className="whitespace-pre-wrap text-emerald-400 leading-relaxed text-[11px] font-mono">
              {ddlSql}
            </pre>
          </div>
        </div>

        {/* Pie del modal con botón de Guardar Cambios */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveAllChanges}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Aplicar Cambios en SQLite'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
