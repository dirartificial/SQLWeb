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
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Calculator
} from 'lucide-react';

export type AggregateFunc = 'NONE' | 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

export type JoinType = 'INNER JOIN' | 'LEFT JOIN' | 'RIGHT JOIN' | 'FULL JOIN';

export interface QueryJoin {
  id: string;
  joinType: JoinType;
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
}

export interface ProjectedColumn {
  id: string;
  column: string; // ej. "productos.precio" o "*"
  aggregate: AggregateFunc;
  alias?: string;
}

export interface FilterCondition {
  id: string;
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IS NULL' | 'IS NOT NULL';
  value: string;
}

export interface HavingCondition {
  id: string;
  expression: string;
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
  const [joins, setJoins] = useState<QueryJoin[]>([]);

  // Columnas a proyectar con orden y funciones de agregación
  const [projectedColumns, setProjectedColumns] = useState<ProjectedColumn[]>([]);
  // Condiciones WHERE
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  // Condiciones HAVING
  const [havingConditions, setHavingConditions] = useState<HavingCondition[]>([]);

  const [orderByColumn, setOrderByColumn] = useState<string>('');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [limit, setLimit] = useState<number>(20);

  const [result, setResult] = useState<ExecutionResult | null>(null);

  // Sincronizar tabla principal si cambia la lista global
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

  // Tablas incluidas actualmente en la consulta (tabla principal + tablas combinadas)
  const includedTables = useMemo(() => {
    const list: string[] = [];
    if (primaryTable) list.push(primaryTable);
    for (const j of joins) {
      if (j.toTable && !list.includes(j.toTable)) {
        list.push(j.toTable);
      }
    }
    return list;
  }, [primaryTable, joins]);

  // Relaciones FK sugeridas entre las tablas actualmente incluidas y otras tablas no incluidas
  const suggestedJoins = useMemo(() => {
    if (tables.length === 0 || includedTables.length === 0) return [];

    const suggestions: {
      fromTable: string;
      fromCol: string;
      toTable: string;
      toCol: string;
      label: string;
    }[] = [];

    // Salientes: tablas incluidas apuntan a tablas no incluidas
    for (const incTable of includedTables) {
      const meta = getTableInfo(incTable);
      if (meta?.foreignKeys) {
        for (const fk of meta.foreignKeys) {
          if (!includedTables.includes(fk.targetTable)) {
            suggestions.push({
              fromTable: incTable,
              fromCol: fk.columnName,
              toTable: fk.targetTable,
              toCol: fk.targetColumn,
              label: `${incTable}.${fk.columnName} = ${fk.targetTable}.${fk.targetColumn}`,
            });
          }
        }
      }
    }

    // Entrantes: tablas no incluidas apuntan a alguna tabla incluida
    for (const t of tables) {
      if (includedTables.includes(t)) continue;
      const meta = getTableInfo(t);
      if (meta?.foreignKeys) {
        for (const fk of meta.foreignKeys) {
          if (includedTables.includes(fk.targetTable)) {
            suggestions.push({
              fromTable: fk.targetTable,
              fromCol: fk.targetColumn,
              toTable: t,
              toCol: fk.columnName,
              label: `${fk.targetTable}.${fk.targetColumn} = ${t}.${fk.columnName}`,
            });
          }
        }
      }
    }

    return suggestions;
  }, [includedTables, tables, getTableInfo]);

  // Lista de todas las columnas disponibles (tabla principal + todas las tablas unidas por JOIN)
  const availableColumns = useMemo(() => {
    const list: { fullName: string; shortName: string; table: string }[] = [];
    for (const tableName of includedTables) {
      const meta = getTableInfo(tableName);
      if (meta) {
        for (const col of meta.columns) {
          list.push({
            fullName: `${tableName}.${col.name}`,
            shortName: col.name,
            table: tableName,
          });
        }
      }
    }
    return list;
  }, [includedTables, getTableInfo]);

  // Al cambiar de tabla principal, inicializar proyectadas y resetear joins/filtros/having
  useEffect(() => {
    if (primaryMeta) {
      const initialProj: ProjectedColumn[] = primaryMeta.columns.map((c) => ({
        id: Math.random().toString(36).substring(2, 9),
        column: `${primaryTable}.${c.name}`,
        aggregate: 'NONE',
      }));
      setProjectedColumns(initialProj);
      setOrderByColumn(primaryMeta.columns[0] ? `${primaryTable}.${primaryMeta.columns[0].name}` : '');
    } else {
      setProjectedColumns([]);
      setOrderByColumn('');
    }
    setJoins([]);
    setFilters([]);
    setHavingConditions([]);
    setResult(null);
  }, [primaryTable, primaryMeta]);

  // Limpiar columnas proyectadas y filtros si una tabla deja de estar en la consulta
  useEffect(() => {
    const validTables = new Set(includedTables);

    setProjectedColumns((prev) =>
      prev.filter((item) => {
        if (item.column === '*') return true;
        const tableName = item.column.split('.')[0];
        return validTables.has(tableName);
      })
    );

    setFilters((prev) =>
      prev.filter((item) => {
        const tableName = item.column.split('.')[0];
        return validTables.has(tableName);
      })
    );

    if (orderByColumn && orderByColumn.includes('.')) {
      const tableName = orderByColumn.split('.')[0];
      if (!validTables.has(tableName)) {
        setOrderByColumn('');
      }
    }
  }, [includedTables]);

  // Agregar un JOIN sugerido por relación FK
  const handleAddSuggestedJoin = (sugg: {
    fromTable: string;
    fromCol: string;
    toTable: string;
    toCol: string;
  }) => {
    setJoins((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        joinType: 'INNER JOIN',
        fromTable: sugg.fromTable,
        fromCol: sugg.fromCol,
        toTable: sugg.toTable,
        toCol: sugg.toCol,
      },
    ]);
  };

  // Agregar un JOIN manual personalizado
  const handleAddCustomJoin = () => {
    const targetTable =
      tables.find((t) => !includedTables.includes(t)) ||
      tables.find((t) => t !== primaryTable) ||
      primaryTable;
    const targetMeta = getTableInfo(targetTable);
    const primaryMeta = getTableInfo(primaryTable);

    const fromCol = primaryMeta?.columns[0]?.name || '';
    const toCol = targetMeta?.columns[0]?.name || '';

    setJoins((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        joinType: 'INNER JOIN',
        fromTable: primaryTable,
        fromCol,
        toTable: targetTable,
        toCol,
      },
    ]);
  };

  // Eliminar un JOIN
  const handleRemoveJoin = (id: string) => {
    setJoins((prev) => prev.filter((j) => j.id !== id));
  };

  // Actualizar un campo de un JOIN
  const handleUpdateJoin = (id: string, field: keyof QueryJoin, value: any) => {
    setJoins((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const updated = { ...j, [field]: value };

        if (field === 'fromTable') {
          const meta = getTableInfo(value);
          updated.fromCol = meta?.columns[0]?.name || '';
        }

        if (field === 'toTable') {
          const meta = getTableInfo(value);
          updated.toCol = meta?.columns[0]?.name || '';
        }

        return updated;
      })
    );
  };

  // Alternar selección de una columna disponible (agregar o quitar)
  const handleToggleAvailableColumn = (colFullName: string) => {
    setProjectedColumns((prev) => {
      const exists = prev.some((item) => item.column === colFullName);
      if (exists) {
        return prev.filter((item) => item.column !== colFullName);
      } else {
        return [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            column: colFullName,
            aggregate: 'NONE',
          },
        ];
      }
    });
  };

  // Reordenar columnas proyectadas (subir posición)
  const handleMoveColumnUp = (index: number) => {
    if (index <= 0) return;
    setProjectedColumns((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  // Reordenar columnas proyectadas (bajar posición)
  const handleMoveColumnDown = (index: number) => {
    setProjectedColumns((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  // Eliminar una columna proyectada
  const handleRemoveProjectedColumn = (id: string) => {
    setProjectedColumns((prev) => prev.filter((col) => col.id !== id));
  };

  // Actualizar función de agregación o alias de una columna proyectada
  const handleUpdateProjectedColumn = (
    id: string,
    field: 'aggregate' | 'alias',
    val: string
  ) => {
    setProjectedColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, [field]: val } : col))
    );
  };

  // Agregar un item especial COUNT(*)
  const handleAddCountStar = () => {
    setProjectedColumns((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        column: '*',
        aggregate: 'COUNT',
        alias: 'total_registros',
      },
    ]);
  };

  // Agregar filtro WHERE
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

  const handleRemoveFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateFilter = (id: string, field: keyof FilterCondition, val: any) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: val } : f))
    );
  };

  // Agregar condición HAVING
  const handleAddHavingCondition = () => {
    const aggProj = projectedColumns.find((c) => c.aggregate !== 'NONE');
    let defaultExpr = '';
    if (aggProj) {
      defaultExpr = aggProj.column === '*' ? 'COUNT(*)' : `${aggProj.aggregate}(${aggProj.column})`;
    } else if (availableColumns.length > 0) {
      defaultExpr = `COUNT(${availableColumns[0].fullName})`;
    } else {
      defaultExpr = 'COUNT(*)';
    }

    setHavingConditions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        expression: defaultExpr,
        operator: '>',
        value: '0',
      },
    ]);
  };

  const handleRemoveHavingCondition = (id: string) => {
    setHavingConditions((prev) => prev.filter((h) => h.id !== id));
  };

  const handleUpdateHavingCondition = (id: string, field: keyof HavingCondition, val: any) => {
    setHavingConditions((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: val } : h))
    );
  };

  // Determinar si hay alguna función de agregación en uso
  const hasAggregates = useMemo(() => {
    return projectedColumns.some((c) => c.aggregate !== 'NONE');
  }, [projectedColumns]);

  // Columnas no agregadas (para GROUP BY automático)
  const nonAggregatedCols = useMemo(() => {
    return projectedColumns
      .filter((c) => c.aggregate === 'NONE' && c.column !== '*')
      .map((c) => c.column);
  }, [projectedColumns]);

  // Expresiones agregadas disponibles para selector HAVING u ORDER BY
  const availableAggregateExpressions = useMemo(() => {
    const exprs: string[] = ['COUNT(*)'];
    for (const col of availableColumns) {
      exprs.push(`COUNT(${col.fullName})`);
      exprs.push(`SUM(${col.fullName})`);
      exprs.push(`AVG(${col.fullName})`);
      exprs.push(`MIN(${col.fullName})`);
      exprs.push(`MAX(${col.fullName})`);
    }
    return exprs;
  }, [availableColumns]);

  // Generar sentencia SQL reactiva
  const generatedSql = useMemo(() => {
    if (!primaryTable) return '';

    // SELECT
    let colsClause = '';
    if (projectedColumns.length === 0) {
      colsClause = `  ${primaryTable}.*`;
    } else {
      colsClause = projectedColumns
        .map((item) => {
          let expr = '';
          if (item.column === '*') {
            expr = item.aggregate === 'NONE' ? '*' : `${item.aggregate}(*)`;
          } else if (item.aggregate === 'NONE') {
            expr = item.column;
          } else {
            expr = `${item.aggregate}(${item.column})`;
          }

          if (item.alias && item.alias.trim() !== '') {
            const cleanAlias = item.alias.trim().replace(/"/g, '""');
            expr += ` AS "${cleanAlias}"`;
          }
          return `  ${expr}`;
        })
        .join(',\n');
    }

    let sql = `SELECT\n${colsClause}\nFROM "${primaryTable}"`;

    // JOINs
    for (const j of joins) {
      if (j.toTable && j.fromTable && j.fromCol && j.toCol) {
        sql += `\n${j.joinType} "${j.toTable}" ON ${j.fromTable}.${j.fromCol} = ${j.toTable}.${j.toCol}`;
      }
    }

    // WHERE
    const validFilters = filters.filter(
      (f) => f.column && (['IS NULL', 'IS NOT NULL'].includes(f.operator) || f.value.trim() !== '')
    );
    if (validFilters.length > 0) {
      const whereClauses = validFilters.map((f) => {
        if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
          return `${f.column} ${f.operator}`;
        }
        if (f.operator === 'LIKE') {
          return `${f.column} LIKE '%${f.value.replace(/'/g, "''")}%'`;
        }
        const isNumeric = !isNaN(Number(f.value)) && f.value.trim() !== '';
        const formattedVal = isNumeric ? f.value.trim() : `'${f.value.replace(/'/g, "''")}'`;
        return `${f.column} ${f.operator} ${formattedVal}`;
      });
      sql += `\nWHERE ${whereClauses.join(' AND ')}`;
    }

    // GROUP BY (automático cuando hay funciones de agregación)
    if (hasAggregates && nonAggregatedCols.length > 0) {
      const uniqueGroupCols = Array.from(new Set(nonAggregatedCols));
      sql += `\nGROUP BY ${uniqueGroupCols.join(', ')}`;
    }

    // HAVING
    const validHaving = havingConditions.filter(
      (h) => h.expression && (['IS NULL', 'IS NOT NULL'].includes(h.operator) || h.value.trim() !== '')
    );
    if (validHaving.length > 0) {
      const havingClauses = validHaving.map((h) => {
        if (h.operator === 'IS NULL' || h.operator === 'IS NOT NULL') {
          return `${h.expression} ${h.operator}`;
        }
        if (h.operator === 'LIKE') {
          return `${h.expression} LIKE '%${h.value.replace(/'/g, "''")}%'`;
        }
        const isNumeric = !isNaN(Number(h.value)) && h.value.trim() !== '';
        const formattedVal = isNumeric ? h.value.trim() : `'${h.value.replace(/'/g, "''")}'`;
        return `${h.expression} ${h.operator} ${formattedVal}`;
      });
      sql += `\nHAVING ${havingClauses.join(' AND ')}`;
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
    projectedColumns,
    joins,
    filters,
    hasAggregates,
    nonAggregatedCols,
    havingConditions,
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
            Diseña consultas visualmente: combina múltiples tablas (INNER, LEFT, RIGHT, FULL JOIN), reordena columnas, aplica funciones de agregación y filtros.
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
            disabled={!isReady || isLoading || projectedColumns.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Consulta</span>
          </button>
        </div>
      </div>

      {/* Bloques de Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* BLOQUE 1: TABLA PRINCIPAL Y COMBINACIONES (JOINs) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <span>Tablas y Relaciones (JOINs)</span>
            </h3>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Tabla principal (FROM):
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

          {/* Detección de Relaciones FK sugeridas */}
          {suggestedJoins.length > 0 && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <span className="font-semibold text-blue-950 text-[11px] block">
                💡 Relaciones de Clave Foránea detectadas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedJoins.map((sugg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSuggestedJoin(sugg)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition-colors shadow-2xs"
                    title={`Agregar JOIN de ${sugg.label}`}
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>+ JOIN {sugg.toTable} ({sugg.label})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de JOINs activos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 text-xs">
                Combinaciones con otras tablas:
              </span>
              {tables.length > 1 && (
                <button
                  type="button"
                  onClick={handleAddCustomJoin}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 rounded-lg transition-colors text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar JOIN</span>
                </button>
              )}
            </div>

            {joins.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px] leading-relaxed italic">
                Consulta individual a "{primaryTable}". Haz clic en <strong>+ Agregar JOIN</strong> o en una relación sugerida para combinar múltiples tablas.
              </div>
            ) : (
              <div className="space-y-2">
                {joins.map((j) => {
                  const fromMeta = getTableInfo(j.fromTable);
                  const toMeta = getTableInfo(j.toTable);

                  return (
                    <div
                      key={j.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        {/* Selector tipo de JOIN */}
                        <select
                          value={j.joinType}
                          onChange={(e) => handleUpdateJoin(j.id, 'joinType', e.target.value as JoinType)}
                          className="px-2 py-1 border border-blue-300 rounded-lg text-xs font-bold font-mono bg-blue-50 text-blue-900"
                        >
                          <option value="INNER JOIN">INNER JOIN (Coincidencia exacta)</option>
                          <option value="LEFT JOIN">LEFT JOIN (Todas las de la izquierda)</option>
                          <option value="RIGHT JOIN">RIGHT JOIN (Todas las de la derecha)</option>
                          <option value="FULL JOIN">FULL JOIN (Todas las filas)</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveJoin(j.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors ml-auto"
                          title="Eliminar este JOIN"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Condición ON */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="font-mono text-slate-500 text-[11px] font-bold">ON</span>

                        {/* Tabla origen y columna */}
                        <select
                          value={j.fromTable}
                          onChange={(e) => handleUpdateJoin(j.id, 'fromTable', e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white min-w-[90px]"
                        >
                          {includedTables.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-400 font-mono">.</span>
                        <select
                          value={j.fromCol}
                          onChange={(e) => handleUpdateJoin(j.id, 'fromCol', e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white min-w-[90px]"
                        >
                          {fromMeta?.columns.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <span className="font-bold text-slate-600 font-mono px-0.5">=</span>

                        {/* Tabla destino y columna */}
                        <select
                          value={j.toTable}
                          onChange={(e) => handleUpdateJoin(j.id, 'toTable', e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white min-w-[90px]"
                        >
                          {tables.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-400 font-mono">.</span>
                        <select
                          value={j.toCol}
                          onChange={(e) => handleUpdateJoin(j.id, 'toCol', e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white min-w-[90px]"
                        >
                          {toMeta?.columns.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE 2: COLUMNAS A PROYECTAR, REORDENAMIENTO Y FUNCIONES DE AGREGACIÓN */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Columnas a Proyectar, Orden y Agregaciones (SELECT)</span>
            </h3>

            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleAddCountStar}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold border border-amber-200 rounded-lg flex items-center gap-1 transition-colors"
                title="Agregar conteo global de registros COUNT(*)"
              >
                <Plus className="w-3 h-3" />
                <span>+ COUNT(*)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const allProj: ProjectedColumn[] = availableColumns.map((c) => ({
                    id: Math.random().toString(36).substring(2, 9),
                    column: c.fullName,
                    aggregate: 'NONE',
                  }));
                  setProjectedColumns(allProj);
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                Todas
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setProjectedColumns([])}
                className="text-blue-600 hover:underline font-semibold"
              >
                Ninguna
              </button>
            </div>
          </div>

          {/* Chips para agregar/quitar columnas disponibles */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Haz clic en las columnas disponibles para incluir o quitar de la lista proyectada:
            </span>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto custom-scrollbar">
              {availableColumns.map((col) => {
                const isSelected = projectedColumns.some((p) => p.column === col.fullName);
                return (
                  <button
                    key={col.fullName}
                    type="button"
                    onClick={() => handleToggleAvailableColumn(col.fullName)}
                    className={`px-2 py-1 rounded-lg border text-xs font-mono transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">{col.table}.</span>
                    <span className="font-semibold">{col.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Columnas Proyectadas (con Reordenamiento, Agregación y Alias) */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 block">
              Lista ordenada de columnas en el SELECT (utiliza los botones de subir/bajar para cambiar la secuencia):
            </span>

            {projectedColumns.length === 0 ? (
              <p className="text-slate-400 py-4 text-center italic border border-dashed border-slate-200 rounded-xl">
                No hay columnas seleccionadas. Selecciona al menos una columna o haz clic en + COUNT(*).
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {projectedColumns.map((col, index) => (
                  <div
                    key={col.id}
                    className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex-wrap sm:flex-nowrap"
                  >
                    {/* Número de posición & Botones de reordenamiento */}
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-600 text-xs w-4 text-center">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleMoveColumnUp(index)}
                          disabled={index === 0}
                          className="text-slate-500 hover:text-blue-600 disabled:opacity-20 p-0.5"
                          title="Subir posición (mostrar antes)"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveColumnDown(index)}
                          disabled={index === projectedColumns.length - 1}
                          className="text-slate-500 hover:text-blue-600 disabled:opacity-20 p-0.5"
                          title="Bajar posición (mostrar después)"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Nombre de Columna */}
                    <div className="font-mono text-xs font-semibold text-slate-800 min-w-[130px] flex-1 truncate">
                      {col.column}
                    </div>

                    {/* Selector de Función de Agregación */}
                    <div className="flex items-center gap-1 min-w-[140px]">
                      <select
                        value={col.aggregate}
                        onChange={(e) =>
                          handleUpdateProjectedColumn(col.id, 'aggregate', e.target.value as AggregateFunc)
                        }
                        className={`w-full px-2 py-1 border rounded-lg text-xs font-semibold font-mono ${
                          col.aggregate !== 'NONE'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="NONE">Sin agregación</option>
                        <option value="COUNT">COUNT (conteo)</option>
                        <option value="SUM">SUM (suma)</option>
                        <option value="AVG">AVG (promedio)</option>
                        <option value="MIN">MIN (mínimo)</option>
                        <option value="MAX">MAX (máximo)</option>
                      </select>
                    </div>

                    {/* Alias opcional (AS) */}
                    <div className="flex items-center gap-1 min-w-[120px]">
                      <span className="text-slate-400 font-mono text-[10px]">AS</span>
                      <input
                        type="text"
                        value={col.alias || ''}
                        onChange={(e) => handleUpdateProjectedColumn(col.id, 'alias', e.target.value)}
                        placeholder="Alias opcional..."
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 focus:bg-white"
                      />
                    </div>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => handleRemoveProjectedColumn(col.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Quitar de la proyección"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              Sin condiciones WHERE. Se evaluarán todas las filas.
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

        {/* BLOQUE 4: AGRUPAMIENTO Y CLÁUSULA HAVING */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">4</span>
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Agrupamiento y Cláusula HAVING</span>
            </h3>

            <button
              type="button"
              onClick={handleAddHavingCondition}
              className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar HAVING</span>
            </button>
          </div>

          {/* Banner explicativo de GROUP BY */}
          {hasAggregates ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <span className="font-bold">GROUP BY activo: </span>
              {nonAggregatedCols.length > 0 ? (
                <span>Se agrupará por las columnas no agregadas ({nonAggregatedCols.join(', ')}).</span>
              ) : (
                <span>Todas las columnas proyectadas utilizan agregación (resultado global).</span>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
              No hay funciones de agregación en las columnas proyectadas. El GROUP BY no es necesario.
            </div>
          )}

          {/* Condiciones HAVING */}
          {havingConditions.length === 0 ? (
            <p className="text-slate-400 py-2 text-center italic">
              Sin condiciones HAVING. (Filtra resultados agrupados por agregaciones).
            </p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
              {havingConditions.map((h) => (
                <div key={h.id} className="flex items-center gap-1.5 flex-wrap bg-amber-50/50 p-2 rounded-xl border border-amber-200">
                  {/* Selector de Expresión Agregada */}
                  <select
                    value={h.expression}
                    onChange={(e) => handleUpdateHavingCondition(h.id, 'expression', e.target.value)}
                    className="px-2 py-1 border border-amber-300 rounded-lg text-xs font-mono bg-white flex-1 min-w-[130px] font-semibold text-amber-900"
                  >
                    <optgroup label="Expresiones recomendadas">
                      {projectedColumns
                        .filter((p) => p.aggregate !== 'NONE')
                        .map((p) => {
                          const expr = p.column === '*' ? 'COUNT(*)' : `${p.aggregate}(${p.column})`;
                          return (
                            <option key={p.id} value={expr}>
                              {expr}
                            </option>
                          );
                        })}
                    </optgroup>
                    <optgroup label="Todas las agregaciones disponibles">
                      {availableAggregateExpressions.map((expr, idx) => (
                        <option key={idx} value={expr}>
                          {expr}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <select
                    value={h.operator}
                    onChange={(e) => handleUpdateHavingCondition(h.id, 'operator', e.target.value)}
                    className="px-2 py-1 border border-amber-300 rounded-lg text-xs font-mono bg-white font-bold text-amber-900"
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

                  {!['IS NULL', 'IS NOT NULL'].includes(h.operator) && (
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => handleUpdateHavingCondition(h.id, 'value', e.target.value)}
                      placeholder="Valor..."
                      className="px-2 py-1 border border-amber-300 rounded-lg text-xs bg-white flex-1 min-w-[80px]"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveHavingCondition(h.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Quitar condición HAVING"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOQUE 5: ORDENAMIENTO Y LÍMITE */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs md:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">5</span>
            <ArrowUpDown className="w-4 h-4 text-blue-600" />
            <span>Ordenamiento y Límite</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-slate-600 font-semibold mb-1">
                Ordenar por:
              </label>
              <select
                value={orderByColumn}
                onChange={(e) => setOrderByColumn(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white font-mono text-xs"
              >
                <option value="">-- Sin orden específico --</option>
                <optgroup label="Columnas Disponibles">
                  {availableColumns.map((c) => (
                    <option key={c.fullName} value={c.fullName}>
                      {c.fullName}
                    </option>
                  ))}
                </optgroup>
                {hasAggregates && (
                  <optgroup label="Expresiones de Agregación">
                    {projectedColumns
                      .filter((p) => p.aggregate !== 'NONE')
                      .map((p) => {
                        const expr = p.column === '*' ? 'COUNT(*)' : `${p.aggregate}(${p.column})`;
                        return (
                          <option key={p.id} value={expr}>
                            {expr}
                          </option>
                        );
                      })}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-slate-600 font-semibold mb-1">
                Dirección:
              </label>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setOrderDirection('ASC')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    orderDirection === 'ASC'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Ascendente (A-Z)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDirection('DESC')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    orderDirection === 'DESC'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Descendente (Z-A)
                </button>
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-slate-600 font-semibold mb-1">
                Límite de registros:
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-xs"
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
