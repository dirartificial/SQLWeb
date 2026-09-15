import React, { useState } from 'react';
import { SqliteDataType, ColumnDefinition, ForeignKeyDefinition } from '../../types/database';
import { useDatabase } from '../../context/DatabaseContext';
import { generateCreateTableSql } from '../../lib/database';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Key,
  Link as LinkIcon,
  Trash2,
  Plus,
  AlertCircle,
  HelpCircle,
  Database,
  Sparkles,
  Code2
} from 'lucide-react';

interface EntityWizardProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const EntityWizard: React.FC<EntityWizardProps> = ({ onCancel, onSuccess }) => {
  const { tables, getTableInfo, createTable } = useDatabase();

  const [step, setStep] = useState<number>(1);
  const [tableName, setTableName] = useState<string>('');
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [foreignKeys, setForeignKeys] = useState<ForeignKeyDefinition[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formulario de nueva columna en Paso 2
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<SqliteDataType>('TEXT');
  const [newColPk, setNewColPk] = useState<boolean>(false);
  const [newColNotNull, setNewColNotNull] = useState<boolean>(true);

  // Formulario de nueva relación en Paso 3
  const [fkSourceCol, setFkSourceCol] = useState<string>('');
  const [fkTargetTable, setFkTargetTable] = useState<string>(tables[0] || '');
  const [fkTargetCol, setFkTargetCol] = useState<string>('');

  // Actualizar columnas destino cuando cambia la tabla destino
  const targetTableInfo = fkTargetTable ? getTableInfo(fkTargetTable) : null;
  const targetTableCols = targetTableInfo ? targetTableInfo.columns : [];

  // Sugerir ID por defecto al inicio
  const handleAddDefaultId = () => {
    if (columns.some((c) => c.name === 'id')) return;
    setColumns((prev) => [
      {
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        isForeignKey: false,
        isNullable: false,
      },
      ...prev,
    ]);
  };

  // Validación y paso 1 -> 2
  const handleNextStep1 = () => {
    const clean = tableName.trim();
    if (!clean) {
      setErrorMessage('Debes ingresar un nombre para la entidad/tabla.');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean)) {
      setErrorMessage('El nombre debe comenzar con una letra y contener solo letras, números o guión bajo (sin espacios).');
      return;
    }
    if (tables.map((t) => t.toLowerCase()).includes(clean.toLowerCase())) {
      setErrorMessage(`Ya existe una tabla llamada "${clean}" en la base de datos.`);
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  // Agregar columna a la lista
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanColName = newColName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanColName) {
      setErrorMessage('Ingresa un nombre para la columna.');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanColName)) {
      setErrorMessage('Nombre de columna inválido (usa solo letras, números y guión bajo).');
      return;
    }
    if (columns.some((c) => c.name.toLowerCase() === cleanColName.toLowerCase())) {
      setErrorMessage(`La columna "${cleanColName}" ya fue agregada.`);
      return;
    }

    const col: ColumnDefinition = {
      name: cleanColName,
      type: newColType,
      isPrimaryKey: newColPk,
      isForeignKey: false,
      isNullable: !newColNotNull,
    };

    setColumns((prev) => [...prev, col]);
    setNewColName('');
    setNewColType('TEXT');
    setNewColPk(false);
    setNewColNotNull(false);
    setErrorMessage(null);
  };

  // Eliminar columna
  const handleRemoveColumn = (nameToRemove: string) => {
    setColumns((prev) => prev.filter((c) => c.name !== nameToRemove));
    // También quitar relaciones que dependan de esta columna
    setForeignKeys((prev) => prev.filter((fk) => fk.columnName !== nameToRemove));
  };

  // Validación y paso 2 -> 3
  const handleNextStep2 = () => {
    if (columns.length === 0) {
      setErrorMessage('Debes definir al menos una columna.');
      return;
    }
    const hasPk = columns.some((c) => c.isPrimaryKey);
    if (!hasPk) {
      setErrorMessage('Toda entidad debe tener al menos una Clave Primaria (PK) para identificar a sus registros.');
      return;
    }
    setErrorMessage(null);

    // Preconfigurar selects del paso 3 si hay tablas destino
    if (tables.length > 0) {
      setFkSourceCol(columns[0]?.name || '');
      setFkTargetTable(tables[0]);
      const firstTargetInfo = getTableInfo(tables[0]);
      const pkCol = firstTargetInfo?.columns.find((c) => c.isPrimaryKey);
      setFkTargetCol(pkCol?.name || firstTargetInfo?.columns[0]?.name || '');
    }

    setStep(3);
  };

  // Agregar relación FK
  const handleAddFk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fkSourceCol || !fkTargetTable || !fkTargetCol) {
      setErrorMessage('Selecciona la columna origen, tabla destino y columna destino.');
      return;
    }

    if (foreignKeys.some((fk) => fk.columnName === fkSourceCol)) {
      setErrorMessage(`La columna "${fkSourceCol}" ya tiene una clave foránea asignada.`);
      return;
    }

    const newFk: ForeignKeyDefinition = {
      columnName: fkSourceCol,
      targetTable: fkTargetTable,
      targetColumn: fkTargetCol,
    };

    setForeignKeys((prev) => [...prev, newFk]);
    // Marcar columna como FK
    setColumns((prev) =>
      prev.map((c) =>
        c.name === fkSourceCol
          ? { ...c, isForeignKey: true, foreignKeyTable: fkTargetTable, foreignKeyColumn: fkTargetCol }
          : c
      )
    );
    setErrorMessage(null);
  };

  const handleRemoveFk = (colName: string) => {
    setForeignKeys((prev) => prev.filter((fk) => fk.columnName !== colName));
    setColumns((prev) =>
      prev.map((c) =>
        c.name === colName
          ? { ...c, isForeignKey: false, foreignKeyTable: undefined, foreignKeyColumn: undefined }
          : c
      )
    );
  };

  // Crear tabla final
  const handleConfirmCreate = () => {
    setErrorMessage(null);
    const result = createTable(tableName.trim(), columns, foreignKeys);
    if (!result.success) {
      setErrorMessage(result.error || 'Error al ejecutar la sentencia DDL.');
      return;
    }
    onSuccess();
  };

  const generatedDdl = tableName ? generateCreateTableSql(tableName.trim(), columns, foreignKeys) : '';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Indicador de pasos */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: 'Entidad' },
            { num: 2, label: 'Columnas' },
            { num: 3, label: 'Relaciones' },
            { num: 4, label: 'DDL y Confirmación' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`hidden sm:inline text-xs font-semibold ${
                  step === s.num ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cuerpo del formulario */}
      <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto min-h-[380px] flex flex-col justify-between">
        {/* Banner de error */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold block">Atención:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* PASO 1: NOMBRE DE LA ENTIDAD */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Paso 1: Nombre de la Entidad (Tabla)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Una entidad representa un conjunto de elementos del mundo real sobre los cuales guardarás información (por ejemplo: Alumnos, Carreras, Materias, Facturas).
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Nombre de la tabla:
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => {
                  setTableName(e.target.value);
                  setErrorMessage(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep1()}
                placeholder="Ejemplo: Alumnos, Carreras, Inscripciones..."
                className="w-full text-sm px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                autoFocus
              />
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 space-y-1">
              <span className="font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Consejo de modelado:
              </span>
              <p className="text-[11px] leading-relaxed text-blue-900">
                Usa nombres sustantivos claros y preferentemente en plural o singular consistente. No uses espacios ni tildes para evitar problemas con la sintaxis SQL.
              </p>
            </div>
          </div>
        )}

        {/* PASO 2: DEFINICIÓN DE COLUMNAS */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Paso 2: Atributos de <span className="text-blue-600 font-mono font-bold">"{tableName}"</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define qué datos se almacenarán en cada fila de esta tabla.
                </p>
              </div>

              {columns.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddDefaultId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sugerir "id" (PK)
                </button>
              )}
            </div>

            {/* Listado de columnas ya añadidas */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Columnas configuradas ({columns.length}):
              </span>

              {columns.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  Aún no has agregado columnas. Utiliza el formulario inferior o el botón de sugerencia rápida.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {columns.map((col) => (
                    <div
                      key={col.name}
                      className="p-3 flex items-center justify-between hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {col.name}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-200 text-slate-700">
                          {col.type}
                        </span>
                        {col.isPrimaryKey && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800">
                            <Key className="w-2.5 h-2.5" />
                            PK
                          </span>
                        )}
                        {!col.isNullable && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-800">
                            NOT NULL
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Eliminar columna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario para agregar una columna */}
            <form onSubmit={handleAddColumn} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                + Nueva Columna
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nombre de columna:
                  </label>
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="ej: nombre, legajo, email"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tipo de dato:
                  </label>
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as SqliteDataType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="INTEGER">INTEGER (Entero: IDs, años, números)</option>
                    <option value="TEXT">TEXT (Texto libre, cadenas, descripciones)</option>
                    <option value="REAL">REAL (Decimal: precios, promedios)</option>
                    <option value="DATE">DATE (Fechas: AAAA-MM-DD)</option>
                    <option value="BOOLEAN">BOOLEAN (Verdadero / Falso: 0 o 1)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newColPk}
                    onChange={(e) => {
                      setNewColPk(e.target.checked);
                      if (e.target.checked) setNewColNotNull(true);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span>Clave Primaria (PK)</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newColNotNull}
                    onChange={(e) => setNewColNotNull(e.target.checked)}
                    disabled={newColPk}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span>Obligatorio (NOT NULL)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Columna</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 3: RELACIONES (FOREIGN KEYS) */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                Paso 3: Claves Foráneas y Relaciones (Opcional)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Una clave foránea (FK) vincula un registro de esta tabla con otro registro de una tabla existente.
              </p>
            </div>

            {tables.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 block">
                  Primera entidad de la base de datos
                </span>
                <p>
                  Como todavía no has creado otras tablas, no hay entidades a las cuales apuntar con una clave foránea.
                </p>
                <p className="text-slate-500">
                  Puedes avanzar directamente al siguiente paso. En las próximas tablas podrás crear relaciones hacia <span className="font-mono font-bold text-blue-600">"{tableName}"</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Relaciones configuradas */}
                {foreignKeys.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Relaciones definidas ({foreignKeys.length}):
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                      {foreignKeys.map((fk) => (
                        <div key={fk.columnName} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap font-mono">
                            <span className="font-bold text-blue-700">{tableName}.{fk.columnName}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-emerald-700">{fk.targetTable}.{fk.targetColumn}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFk(fk.columnName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulario para añadir FK */}
                <form onSubmit={handleAddFk} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">
                    + Vincular columna con otra tabla
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Columna en "{tableName}":
                      </label>
                      <select
                        value={fkSourceCol}
                        onChange={(e) => setFkSourceCol(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tabla destino:
                      </label>
                      <select
                        value={fkTargetTable}
                        onChange={(e) => {
                          setFkTargetTable(e.target.value);
                          const targetMeta = getTableInfo(e.target.value);
                          const pkCol = targetMeta?.columns.find((c) => c.isPrimaryKey);
                          setFkTargetCol(pkCol?.name || targetMeta?.columns[0]?.name || '');
                        }}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      >
                        {tables.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Columna destino (PK):
                      </label>
                      <select
                        value={fkTargetCol}
                        onChange={(e) => setFkTargetCol(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      >
                        {targetTableCols.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} {c.isPrimaryKey ? '(PK)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Relación</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* PASO 4: PREVISUALIZACIÓN DDL Y CONFIRMACIÓN */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-600" />
                Paso 4: Código DDL Generado y Aprendizaje
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Revisa la sentencia SQL que se ejecutará en la base de datos para crear tu entidad.
              </p>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto custom-scrollbar leading-relaxed">
                <code>{generatedDdl}</code>
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Entidad:</span>
                <span className="font-mono font-bold text-slate-800">{tableName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Columnas:</span>
                <span className="font-semibold text-slate-800">{columns.length} atributos</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Clave Primaria:</span>
                <span className="font-mono font-semibold text-amber-700">
                  {columns.filter((c) => c.isPrimaryKey).map((c) => c.name).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Claves Foráneas:</span>
                <span className="font-mono font-semibold text-blue-700">
                  {foreignKeys.length > 0
                    ? foreignKeys.map((fk) => `${fk.columnName} -> ${fk.targetTable}`).join(', ')
                    : 'Sin relaciones'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación del Wizard */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {step === 1 ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep((prev) => prev - 1);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleNextStep1}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              <span>Siguiente: Columnas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleNextStep2}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              <span>Siguiente: Relaciones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep(4);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              <span>Siguiente: Ver DDL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleConfirmCreate}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Crear Tabla en SQLite</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
