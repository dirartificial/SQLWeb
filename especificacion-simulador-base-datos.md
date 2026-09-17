# Especificación: Simulador Web de Base de Datos (equivalente a LibreOffice Base)

## 1. Contexto y objetivo

Aplicación destinada a estudiantes de la Tecnicatura Superior en Ciencia de Datos e IA que cursan de forma virtual, accediendo desde celular o tablet. El objetivo es que puedan aprender los mismos conceptos que se enseñan con LibreOffice Base (creación de entidades, formularios de carga, consultas y reportes) pero en una web app liviana, sin instalación, que funcione bien en pantallas chicas y táctiles.

No es un clon completo de LibreOffice Base: es un simulador pedagógico enfocado en los cuatro pilares que se enseñan en clase:

1. Diseño de entidades (tablas, atributos, tipos, clave primaria y foránea)
2. Formularios de entrada de datos
3. Consultas (asistidas y en SQL directo)
4. Informes/reportes

## 2. Stack técnico

- **Frontend**: React + Vite (SPA). Alternativa más liviana: JS vanilla + Web Components si se prefiere evitar build tooling.
- **Motor de base de datos**: SQL.js (SQLite compilado a WebAssembly) corriendo 100% en el navegador. No requiere backend para el modelado ni para las consultas.
- **Editor SQL**: CodeMirror 6 (o Ace Editor) con resaltado de sintaxis SQL.
- **Reportes**: HTML renderizado + exportación a PDF vía `window.print()` con una hoja de estilos `@media print`, o jsPDF si se necesita más control.
- **Persistencia local**: IndexedDB, para que cada alumno conserve su base de datos entre sesiones en el mismo dispositivo/navegador.
- **Backend (opcional, ver sección 8)**: sólo si se quiere guardar el trabajo de cada alumno en el servidor y armar un dashboard docente. No es necesario para el funcionamiento base de la app.
- **Despliegue**: sitio estático (sin backend obligatorio), servible desde el hosting/Apache ya usado para el sistema de quizzes.

## 3. Modelo de datos interno de la aplicación (metadata)

Además de la base SQLite que crea cada alumno, la app necesita su propia metadata en memoria/estado de React para poder generar formularios e informes sin tener que parsear DDL a mano:

```
Entidad (tabla)
  - nombre
  - columnas: [
      {
        nombre,
        tipo: INTEGER | TEXT | REAL | DATE | BOOLEAN,
        esClavePrimaria: boolean,
        esClaveForanea: boolean,
        tablaReferenciada?: string,
        columnaReferenciada?: string,
        obligatorio: boolean
      }
    ]
```

Esta metadata se puede reconstruir en cualquier momento vía `PRAGMA table_info(nombre_tabla)` y `PRAGMA foreign_key_list(nombre_tabla)` contra la instancia de SQL.js, así que no hace falta duplicar el estado si se prefiere simplicidad: se puede leer directo de la base cada vez que se necesite.

## 4. Módulos funcionales (detalle para implementación)

### 4.1 Diseñador de entidades

**Objetivo**: que el alumno cree tablas visualmente, sin escribir SQL, y vea el DDL generado como aprendizaje.

**UI**:
- Botón "Nueva entidad" → formulario con nombre de la tabla.
- Dentro de la entidad: agregar columnas una por una (nombre, tipo desde un select, checkbox "clave primaria", checkbox "obligatorio"), con controles para reordenar columnas (subir/bajar) y cambiar el tipo de dato de columnas ya configuradas.
- Botón "Agregar relación" → selector de tabla destino + columna destino → genera `FOREIGN KEY`.
- Al guardar, se muestra el DDL generado (`CREATE TABLE ...`) antes de ejecutarlo, para que el alumno lo lea.
- Listado de entidades creadas, con opción de editar estructura completa (`ALTER TABLE` / recreación de tabla): renombrar tabla, renombrar columna, cambiar tipo de dato, reordenar posición de columnas (subir/bajar), eliminar columna y agregar columna manteniendo los registros existentes.
- Opción de editar el nombre de la base de datos activa (en la cabecera y en el panel de gestión local), el cual se utiliza para nombrar los archivos `.sqlite` descargados.

**Validaciones**:
- No permitir nombres de tabla/columna duplicados.
- Exigir al menos una clave primaria por tabla.
- No permitir crear una FK hacia una tabla que no exista todavía.

**Salida**: ejecuta el `CREATE TABLE` contra la instancia SQL.js activa del alumno.

### 4.2 Formularios de entrada de datos

**Objetivo**: simular los formularios de LO Base — introducir y modificar registros de forma guiada.

**UI**:
- Selector de tabla.
- La app lee la estructura de la tabla (vía PRAGMA) y genera automáticamente un input por columna, con el tipo de control según el tipo de dato (texto, número, fecha, checkbox para booleanos).
- Si una columna es FK, el input se reemplaza por un `<select>` con los registros existentes de la tabla referenciada (mostrando una columna "legible", no sólo el ID).
- Botones: Guardar (INSERT), Buscar/Editar registro existente (UPDATE), Eliminar (DELETE).
- Debajo del formulario, listado tipo grilla de los registros ya cargados en esa tabla.

**Validaciones**:
- Respetar `NOT NULL` y tipos de dato definidos en el diseñador.
- Mostrar error legible si se viola una FK (registro referenciado no existe).

### 4.3 Consultas

Dos niveles, igual que LO Base separa "asistente de consultas" de "vista SQL":

**4.3.1 Constructor visual (opcional/fase 2)**:
- Elegir tabla o combinación simple de 2 tablas (join por FK detectada automáticamente).
- Elegir columnas a mostrar y modificar su orden de proyección (subir/bajar posición en el SELECT).
- Aplicar funciones de agregación (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) sobre las columnas proyectadas.
- Inclusión automática o configurable de la cláusula `GROUP BY` cuando se emplean funciones de agregación.
- Agregar filtros sobre filas (`WHERE`) y filtros sobre resultados agrupados (`HAVING`).
- Genera el `SELECT` correspondiente en tiempo real y permite ejecutarlo o transferirlo al Editor SQL.

**4.3.2 Editor SQL directo**:
- Textarea/CodeMirror con SQL libre.
- Botón "Ejecutar" → corre contra SQL.js y muestra el resultado en una tabla.
- Mostrar mensajes de error de SQLite tal cual (para que el alumno aprenda a leerlos).
- Historial de las últimas N consultas ejecutadas en la sesión.

### 4.4 Informes/reportes

**Objetivo**: igual que un informe de LO Base, una vista de datos ordenada para imprimir o exportar, a partir de una tabla o de una consulta guardada.

**UI**:
- Elegir origen: tabla o resultado de una consulta guardada.
- Elegir columnas a incluir y, opcionalmente, una columna de agrupamiento con conteo/suma.
- Vista previa con formato de "hoja de informe" (encabezado, fecha de generación, filas agrupadas).
- Botón "Exportar a PDF" (usa `window.print()` con CSS de impresión, o jsPDF).

### 4.5 Adaptación móvil/táctil

- Todo el flujo de alta de entidades y columnas debe resolverse con formularios paso a paso (wizard), no con un diagrama ER de arrastrar y soltar — en pantalla táctil chica un canvas de ER es inutilizable.
- Botones grandes, un input a la vez cuando la pantalla es angosta (breakpoint por ancho, no sólo user-agent).
- Las tablas de resultados largas deben poder scrollear horizontalmente sin romper el layout.

## 5. Orden de desarrollo sugerido (fases)

1. **Fase 0 — Esqueleto**: proyecto React/Vite con SQL.js cargado y funcionando (una consulta de prueba visible en pantalla).
2. **Fase 1 — Diseñador de entidades** (sección 4.1).
3. **Fase 2 — Formularios de carga** (sección 4.2), depende de la Fase 1.
4. **Fase 3 — Editor SQL directo** (sección 4.3.2), puede hacerse en paralelo con la Fase 2.
5. **Fase 4 — Informes** (sección 4.4), depende de tener datos cargados (Fase 2) y consultas (Fase 3).
6. **Fase 5 — Constructor visual de consultas** (sección 4.3.1), opcional, sólo si sobra tiempo.
7. **Fase 6 — Responsive/táctil**, pasada transversal al final sobre todos los módulos.
8. **Fase 7 — Persistencia en IndexedDB**, para que el trabajo del alumno no se pierda al cerrar el navegador.

Cada fase es una tarea independiente para pasarle a un agente (Antigravity), con su propio criterio de aceptación (ver sección 7).

## 6. Backend opcional: seguimiento docente

Si se quiere un dashboard tipo el del sistema de quizzes (ver progreso de cada alumno en tiempo real):

- Endpoint simple (PHP, reutilizando el stack Apache/PHP existente) que reciba periódicamente un snapshot: DDL actual del alumno + cantidad de registros por tabla + últimas consultas ejecutadas.
- Tabla en la base del servidor: `alumno_id, timestamp, ddl_actual, resumen_datos, ultima_consulta`.
- Vista docente: listado de alumnos con su progreso (cuántas entidades armaron, si tienen FK, si ejecutaron consultas).
- Este módulo es independiente del resto y se implementa por separado, sin mezclarlo con las tareas de frontend.

## 7. Criterios de aceptación por módulo

- **Diseñador de entidades**: se puede crear una tabla con PK y al menos una FK hacia otra tabla ya creada, y el DDL generado es válido SQL SQLite.
- **Formularios**: insertar un registro respeta tipos y NOT NULL; una FK inválida muestra error legible, no un error crudo de SQLite sin contexto.
- **Constructor visual / Query builder**: se puede seleccionar el orden de las columnas proyectadas, aplicar funciones de agregación (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), generar la cláusula `GROUP BY` y aplicar filtros mediante la cláusula `HAVING`.
- **Editor SQL**: un SELECT con JOIN entre dos tablas creadas por el alumno devuelve resultados correctos.
- **Informes**: un informe agrupado por una columna muestra totales correctos y se puede exportar a PDF legible.
- **Responsive**: todo el flujo de alta de entidad y carga de datos se completa sin zoom ni scroll horizontal en una pantalla de 375px de ancho.

## 8. Despliegue

- Build estático (`vite build`) servido como sitio estático, sin necesidad de backend para las fases 0 a 5 y 7.
- Si se agrega el módulo docente (sección 6), ese componente sí necesita el backend PHP existente.

## 9. Nota para uso con Antigravity

Cada fase de la sección 5 puede pasarse como un prompt independiente al agente, citando la sección correspondiente de este documento (por ejemplo: "implementá el módulo 4.2 tal como está descripto, sobre el proyecto ya existente"). Revisar los artefactos (plan y checklist) que deja el agente antes de aceptar cada cambio, en particular que el DDL generado coincida con lo que se va a explicar en clase.
