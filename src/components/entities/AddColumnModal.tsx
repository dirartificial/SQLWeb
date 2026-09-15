import React, { useState } from 'react';
import { SqliteDataType, ColumnDefinition } from '../../types/database';
import { useDatabase } from '../../context/DatabaseContext';
import { X, Plus, AlertCircle } from 'lucide-react';

interface AddColumnModalProps {
  tableName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  tableName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addNewColumn } = useDatabase();
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState<SqliteDataType>('TEXT');
  const [isNullable, setIsNullable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = colName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanName) {
      setError('El nombre de la columna es obligatorio.');
      return;
    }

    const newCol: ColumnDefinition = {
      name: cleanName,
      type: colType,
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable,
    };

    const res = addNewColumn(tableName, newCol);
    if (!res.success) {
      setError(res.error || 'Error al agregar la columna.');
    } else {
      setColName('');
      setError(null);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Agregar Columna</h3>
            <p className="text-xs text-slate-500">
              Tabla: <span className="font-semibold text-blue-600 font-mono">{tableName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de la columna
            </label>
            <input
              type="text"
              value={colName}
              onChange={(e) => {
                setColName(e.target.value);
                setError(null);
              }}
              placeholder="ej: telefono, direccion, nota"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de dato
            </label>
            <select
              value={colType}
              onChange={(e) => setColType(e.target.value as SqliteDataType)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="TEXT">TEXT (Texto libre, cadenas)</option>
              <option value="INTEGER">INTEGER (Números enteros)</option>
              <option value="REAL">REAL (Números decimales)</option>
              <option value="DATE">DATE (Fechas)</option>
              <option value="BOOLEAN">BOOLEAN (Verdadero / Falso)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isNullable"
              checked={!isNullable}
              onChange={(e) => setIsNullable(!e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="isNullable" className="text-xs text-slate-700 select-none">
              Campo obligatorio (NOT NULL)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ejecutar ALTER TABLE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
