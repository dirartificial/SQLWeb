import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { ExecutionResult } from '../../types/database';
import {
  Wand2,
  Play,
  Code2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  ArrowUpDown,
  Link as LinkIcon,
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';

interface FilterCondition {
  id: string;
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IS NULL' | 'IS NOT NULL';
  value: string;
}

interface QueryBuilderProps {
  onOpenInSqlEditor: (sql: string) => void;
  onNavigateToEntities?: () => void;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  onOpenInSqlEditor,
  onNavigateToEntities,
}) => {
  const { tables, getTableInfo, exec, isReady, isLoading } = useDatabase();

  const [primaryTable, setPrimaryTable] = useState<string>(tables[0] || '');
  const [enableJoin, setEnableJoin] = useState<boolean>(false);
  const [joinFkIndex, setJoinFkIndex] = useState<number>(0);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [orderByColumn, setOrderByColumn] = useState<string>('');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [limit, setLimit] = useState<number>(20);

  const [result, setResult] = useState<ExecutionResult | null>(null);

  // Sincronizar tabla si cambia la lista
  useEffect(() => {
    if (!primaryTable && tables.length > 0) {
      setPrimaryTable(tables[0]);
    }
  }, [tables, primaryTable]);

  // Metadata de la tabla principal
  const primaryMeta = useMemo(() => {
    if (!primaryTable) return null;
    return getTableInfo(primaryTable);
  }, [primaryTable, getTableInfo]);

  // Detectar relaciones FK disponibles para JOIN
  // 1. Relaciones donde primaryTable tiene FK hacia otra tabla
  // 2. Relaciones donde otra tabla tiene FK hacia primaryTable
  const availableJoins = useMemo(() => {
    if (!primaryTable || !primaryMeta) return [];

    const joins: {
      type: 'outgoing' | 'incoming';
      fromTable: string;
      fromCol: string;
      toTable: string;
      toCol: string;
      label: string;
    }[] = [];

    // Salientes (primaryTable apunta a otra)
    if (primaryMeta.foreignKeys) {
      for (const fk of primaryMeta.foreignKeys) {
        joins.push({
          type: 'outgoing',
          fromTable: primaryTable,
          fromCol: fk.columnName,
          toTable: fk.targetTable,
          toCol: fk.targetColumn,
          label: `${primaryTable}.${fk.columnName} = ${fk.targetTable}.${fk.targetColumn}`,
        });
      }
    }

    // Entrantes (otras tablas apuntan a primaryTable)
    for (const t of tables) {
      if (t === primaryTable) continue;
      const otherMeta = getTableInfo(t);
      if (otherMeta && otherMeta.foreignKeys) {
        for (const fk of otherMeta.foreignKeys) {
          if (fk.targetTable === primaryTable) {
            joins.push({
              type: 'incoming',
              fromTable: t,
              fromCol: fk.columnName,
              toTable: primaryTable,
              toCol: fk.targetColumn,
              label: `${t}.${fk.columnName} = ${primaryTable}.${fk.targetColumn}`,
            });
          }
        }
      }
    }

    return joins;
  }, [primaryTable, primaryMeta, tables, getTableInfo]);

  const activeJoin = availableJoins[joinFkIndex] || null;
  const secondaryTable = activeJoin
    ? activeJoin.type === 'outgoing'
      ? activeJoin.toTable
      : activeJoin.fromTable
    : null;
  const secondaryMeta = useMemo(() => {
    if (!secondaryTable) return null;
    return getTableInfo(secondaryTable);
  }, [secondaryTable, getTableInfo]);

  // Columnas disponibles (de la tabla principal + secundaria si hay JOIN)
  const availableColumns = useMemo(() => {
    const list: { fullName: string; shortName: string; table: string }[] = [];
    if (primaryMeta) {
      for (const col of primaryMeta.columns) {
        list.push({
          fullName: `${primaryTable}.${col.name}`,
          shortName: col.name,
          table: primaryTable,
        });
      }
    }
    if (enableJoin && secondaryMeta && secondaryTable) {
      for (const col of secondaryMeta.columns) {
        list.push({
          fullName: `${secondaryTable}.${col.name}`,
          shortName: col.name,
          table: secondaryTable,
        });
      }
    }
    return list;
  }, [primaryMeta, primaryTable, enableJoin, secondaryMeta, secondaryTable]);

  // Al cambiar de tabla principal, resetear selección de columnas y filtros
  useEffect(() => {
    if (primaryMeta) {
      setSelectedColumns(primaryMeta.columns.map((c) => `${primaryTable}.${c.name}`));
      setOrderByColumn(primaryMeta.columns[0] ? `${primaryTable}.${primaryMeta.columns[0].name}` : '');
    }
    setEnableJoin(false);
    setJoinFkIndex(0);
    setFilters([]);
    setResult(null);
  }, [primaryTable, primaryMeta]);

  // Generar la sentencia SQL reactiva
  const generatedSql = useMemo(() => {
    if (!primaryTable) return '';

    // SELECT
    const colsClause =
      selectedColumns.length > 0 ? selectedColumns.map((c) => `  ${c}`).join(',\n') : `  ${primaryTable}.*`;

    let sql = `SELECT\n${colsClause}\nFROM "${primaryTable}"`;

    // JOIN
    if (enableJoin && activeJoin && secondaryTable) {
      if (activeJoin.type === 'outgoing') {
        sql += `\nINNER JOIN "${secondaryTable}" ON ${primaryTable}.${activeJoin.fromCol} = ${secondaryTable}.${activeJoin.toCol}`;
      } else {
        sql += `\nINNER JOIN "${secondaryTable}" ON ${secondaryTable}.${activeJoin.fromCol} = ${primaryTable}.${activeJoin.toCol}`;
      }
    }

    // WHERE
    const validFilters = filters.filter((f) => f.column && (['IS NULL', 'IS NOT NULL'].includes(f.operator) || f.value.trim() !== ''));
    if (validFilters.length > 0) {
      const whereClauses = validFilters.map((f) => {
        if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
          return `${f.column} ${f.operator}`;
        }
        if (f.operator === 'LIKE') {
          return `${f.column} LIKE '%${f.value.replace(/'/g, "''")}%'`;
        }
        // Determinar si el valor es numérico o texto
        const isNumeric = !isNaN(Number(f.value)) && f.value.trim() !== '';
        const formattedVal = isNumeric ? f.value.trim() : `'${f.value.replace(/'/g, "''")}'`;
        return `${f.column} ${f.operator} ${formattedVal}`;
      });
      sql += `\nWHERE ${whereClauses.join(' AND ')}`;
    }

    // ORDER BY
    if (orderByColumn) {
      sql += `\nORDER BY ${orderByColumn} ${orderDirection}`;
    }

    // LIMIT
    if (limit && limit > 0) {
      sql += `\nLIMIT ${limit};`;
    } else {
      sql += ';';
    }

    return sql;
  }, [
    primaryTable,
    selectedColumns,
    enableJoin,
    activeJoin,
    secondaryTable,
    filters,
    orderByColumn,
    orderDirection,
    limit,
  ]);

  // Ejecutar consulta generada
  const handleExecute = () => {
    if (!generatedSql || !isReady || isLoading) return;
    const res = exec(generatedSql);
    setResult(res);
  };

  // Agregar filtro
  const handleAddFilter = () => {
    const firstCol = availableColumns[0]?.fullName || '';
    setFilters((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        column: firstCol,
        operator: '=',
        value: '',
      },
    ]);
  };

  // Eliminar filtro
  const handleRemoveFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  // Actualizar filtro
  const handleUpdateFilter = (id: string, field: keyof FilterCondition, val: any) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: val } : f))
    );
  };

  // Toggle de columnas
  const handleToggleColumn = (colFullName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colFullName)
        ? prev.filter((c) => c !== colFullName)
        : [...prev, colFullName]
    );
  };

  if (tables.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No hay tablas para construir consultas</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Crea tus entidades y carga datos para utilizar el constructor visual de consultas guiado.
            </p>
          </div>
          {onNavigateToEntities && (
            <button
              onClick={onNavigateToEntities}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Ir al Diseñador de Entidades</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            Asistente Visual de Consultas (Query Builder)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Diseña consultas de forma guiada seleccionando tablas, relaciones JOIN y condiciones WHERE sin escribir SQL.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenInSqlEditor(generatedSql)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
            title="Abre la consulta generada en el editor directo para continuar editándola a mano"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Abrir en Editor SQL</span>
          </button>

          <button
            onClick={handleExecute}
            disabled={!isReady || isLoading || selectedColumns.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Consulta</span>
          </button>
        </div>
      </div>

      {/* Asistente por Bloques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* BLOQUE 1: TABLA PRINCIPAL Y COMBINACIÓN JOIN */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
            <span>Tablas y Relaciones</span>
          </h3>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Tabla principal:
            </label>
            <select
              value={primaryTable}
              onChange={(e) => setPrimaryTable(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono text-xs font-semibold"
            >
              {tables.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Detección de Relación FK para INNER JOIN */}
          {availableJoins.length > 0 ? (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-blue-950">
                <input
                  type="checkbox"
                  checked={enableJoin}
                  onChange={(e) => setEnableJoin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Combinar con tabla relacionada (INNER JOIN)</span>
              </label>

              {enableJoin && (
                <div className="pt-1 space-y-1 animate-fade-in">
                  <label className="block text-[11px] text-blue-800 font-medium">
                    Relación detectada:
                  </label>
                  <select
                    value={joinFkIndex}
                    onChange={(e) => setJoinFkIndex(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-blue-300 rounded-lg bg-white text-xs font-mono"
                  >
                    {availableJoins.map((j, idx) => (
                      <option key={idx} value={idx}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px] leading-relaxed">
              No se detectaron relaciones de Clave Foránea directas para esta tabla. Puedes seguir consultándola individualmente.
            </div>
          )}
        </div>

        {/* BLOQUE 2: COLUMNAS A MOSTRAR */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
              <span>Columnas a Proyectar (SELECT)</span>
            </h3>

            <div className="flex items-center gap-2 text-[11px] text-blue-600">
              <button
                type="button"
                onClick={() => setSelectedColumns(availableColumns.map((c) => c.fullName))}
                className="hover:underline"
              >
                Todas
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setSelectedColumns([])}
                className="hover:underline"
              >
                Ninguna
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto custom-scrollbar p-1">
            {availableColumns.map((col) => {
              const isSelected = selectedColumns.includes(col.fullName);
              return (
                <button
                  key={col.fullName}
                  type="button"
                  onClick={() => handleToggleColumn(col.fullName)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] opacity-75">{col.table}.</span>
                  <span className="font-semibold">{col.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BLOQUE 3: FILTROS Y CONDICIONES (WHERE) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Condiciones de Filtro (WHERE)</span>
            </h3>

            <button
              type="button"
              onClick={handleAddFilter}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Filtro</span>
            </button>
          </div>

          {filters.length === 0 ? (
            <p className="text-slate-400 py-3 text-center italic">
              Sin condiciones. Se mostrarán todos los registros de la tabla.
            </p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
              {filters.map((f) => (
                <div key={f.id} className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <select
                    value={f.column}
                    onChange={(e) => handleUpdateFilter(f.id, 'column', e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white flex-1 min-w-[110px]"
                  >
                    {availableColumns.map((c) => (
                      <option key={c.fullName} value={c.fullName}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={f.operator}
                    onChange={(e) => handleUpdateFilter(f.id, 'operator', e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white font-bold text-blue-700"
                  >
                    <option value="=">=</option>
                    <option value="!=">!=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="LIKE">contiene (LIKE)</option>
                    <option value="IS NULL">es NULL</option>
                    <option value="IS NOT NULL">no es NULL</option>
                  </select>

                  {!['IS NULL', 'IS NOT NULL'].includes(f.operator) && (
                    <input
                      type="text"
                      value={f.value}
                      onChange={(e) => handleUpdateFilter(f.id, 'value', e.target.value)}
                      placeholder="Valor..."
                      className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white flex-1 min-w-[90px]"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveFilter(f.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Quitar filtro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOQUE 4: ORDENAMIENTO Y LÍMITE */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">4</span>
            <ArrowUpDown className="w-4 h-4 text-blue-600" />
            <span>Ordenamiento y Límite</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Ordenar por:
              </label>
              <select
                value={orderByColumn}
                onChange={(e) => setOrderByColumn(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white font-mono text-xs"
              >
                <option value="">-- Sin orden específico --</option>
                {availableColumns.map((c) => (
                  <option key={c.fullName} value={c.fullName}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Dirección:
              </label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOrderDirection('ASC')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    orderDirection === 'ASC'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Ascendente (A-Z)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDirection('DESC')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    orderDirection === 'DESC'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Descendente (Z-A)
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-1">
              <label className="text-slate-600 font-semibold">
                Límite de registros a mostrar:
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
              >
                <option value={10}>10 registros</option>
                <option value={20}>20 registros</option>
                <option value={50}>50 registros</option>
                <option value={100}>100 registros</option>
                <option value={0}>Sin límite (todos)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SQL GENERADO EN TIEMPO REAL */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white space-y-3 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Sentencia SQL construida en vivo:
          </span>
          <button
            onClick={() => onOpenInSqlEditor(generatedSql)}
            className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-sans"
          >
            <span>Editar SQL en consola libre</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <pre className="font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed">
          <code>{generatedSql}</code>
        </pre>
      </div>

      {/* RESULTADOS DE LA CONSULTA */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              {result.success ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs sm:text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Consulta ejecutada con éxito</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-700 text-xs sm:text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Error al ejecutar la consulta</span>
                </div>
              )}
            </div>

            {result.executionTimeMs !== undefined && (
              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{result.executionTimeMs} ms</span>
              </div>
            )}
          </div>

          {!result.success && result.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono text-red-800 break-words">
              {result.error}
            </div>
          )}

          {result.success && result.results && result.results.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                {result.results[0].values.length} {result.results[0].values.length === 1 ? 'fila devuelta' : 'filas devueltas'}
              </div>

              <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 font-mono">
                  <thead className="bg-slate-50 text-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                    <tr>
                      {result.results[0].columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-2.5 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {result.results[0].values.length === 0 ? (
                      <tr>
                        <td
                          colSpan={result.results[0].columns.length}
                          className="px-4 py-6 text-center text-slate-400 italic font-sans"
                        >
                          No se encontraron filas que cumplan con los filtros.
                        </td>
                      </tr>
                    ) : (
                      result.results[0].values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2 whitespace-nowrap">
                              {cell === null ? (
                                <span className="text-slate-400 italic font-sans text-[11px]">NULL</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
