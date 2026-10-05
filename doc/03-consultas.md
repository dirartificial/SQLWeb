# Manual de Usuario: Pestaña 3 - Consultas (SQL)

El módulo **Consultas (SQL)** te permite explorar y consultar tus datos en dos niveles diferentes, simulando las vistas de LibreOffice Base:
1. **Asistente Visual (Query Builder)**: Diseña consultas mediante controles de selección de interfaz, orden de columnas, funciones de agregación (`COUNT`, `SUM`, etc.), filtros `WHERE`, agrupamientos `GROUP BY` y condiciones `HAVING`.
2. **Editor SQL Libre**: Escribe sentencias SQL estándar con resaltado de sintaxis, autocompletado y acceso a la consola de ejecución SQLite.

---

## 📌 Acceso al Módulo

1. Haz clic en la pestaña **`3. Consultas (SQL)`** en la barra superior (o **`Consultas`** en el menú inferior).
2. En la sub-navegación superior, elige entre:
   - **`Wand2` Asistente Visual (Diseñador)**
   - **`Code2` Editor SQL Libre**

---

## 🪄 1. Asistente Visual (Query Builder)

El **Query Builder** te permite estructurar consultas complejas paso a paso sin escribir código SQL a mano.

### A. Selección de Tabla Principal y Combinaciones (`JOIN`)
1. **Tabla Principal**: En el desplegable **`Tabla Principal`**, elige la entidad base (ej. `Alumnos`).
2. **Combinar con otra Tabla (JOIN)**:
   - Si existen relaciones de clave foránea definidas, el asistente te sugerirá enlaces inteligentes en el recuadro superior. Haz clic en **`+ Agregar JOIN`**.
   - Configura el tipo de unión (`INNER JOIN`, `LEFT JOIN`), la columna origen y la tabla/columna destino (ej. `Alumnos.id_carrera = Carreras.id`).

---

### B. Proyección de Columnas y Reordenamiento
1. En la sección **"Columnas a Proyectar"**:
   - Marca las casillas de verificación de las columnas que deseas incluir en el resultado `SELECT`.
2. **Reordenar orden de salida**:
   - En la lista de columnas seleccionadas, haz clic en las flechas **`▲` (Subir)** o **`▼` (Bajar)** para alterar el orden relativo de las columnas en la proyección SQL.

---

### C. Funciones de Agregación y Agrupamiento (`GROUP BY`)
1. **Aplicar Funciones de Agregación**:
   - Al lado de cada columna proyectada, selecciona una función en el menú desplegable:
     - `NONE`: Muestra el valor de la columna sin modificar.
     - `COUNT`: Cuenta la cantidad de registros.
     - `SUM`: Suma los valores numéricos de la columna.
     - `AVG`: Calcula el promedio numérico.
     - `MIN`: Obtiene el valor mínimo.
     - `MAX`: Obtiene el valor máximo.
2. **Cláusula `GROUP BY`**:
   - Si seleccionas al menos una función de agregación, el sistema activará automáticamente la lógica de **`GROUP BY`** sobre las demás columnas proyectadas no agregadas, respetando las reglas de sintaxis de SQL estándar.

---

### D. Filtros sobre Filas (`WHERE`)
1. Haz clic en el botón **`+ Agregar Filtro (WHERE)`**.
2. Selecciona la columna a filtrar (ej. `duracion_anios`).
3. Elige el operador condicional: `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IS NULL`, `IS NOT NULL`.
4. Ingresa el valor a comparar (ej. `3`).

---

### E. Filtros sobre Resultados Agrupados (`HAVING`)
1. Cuando utilices agrupamientos (`GROUP BY`), haz clic en **`+ Agregar Condición HAVING`**.
2. Elige la expresión agregada (ej. `COUNT(Alumnos.id)`).
3. Selecciona el operador (ej. `>=`) e ingresa el valor (ej. `5`).

---

### F. Ordenamiento (`ORDER BY`) y Límite (`LIMIT`)
1. **Ordenamiento**: Elige la columna por la cual ordenar y selecciona el sentido: **Ascendente (`ASC`)** o **Descendente (`DESC`)**.
2. **Límite**: Ajusta la cantidad máxima de filas a devolver en el campo `LIMIT` (por defecto `20`).

---

### G. Ejecución y Transferencia al Editor SQL
1. **Visualizar SQL en tiempo real**: En la tarjeta inferior verás la sentencia SQL generada automáticamente.
2. **Ejecutar**: Haz clic en el botón azul **`▶ Ejecutar Consulta`** para ver los resultados en la grilla inferior.
3. **Transferir al Editor SQL Libre**: Haz clic en el botón **`Abrir en Editor SQL`** (ícono `Code2`). La consulta construida visualmente se copiará intacta al Editor SQL para que puedas hacerle ajustes finos a mano.

---

### 💡 Ejemplo Práctico con Query Builder (Paso a Paso):
**Objetivo**: Contar cuántos alumnos hay inscriptos por cada carrera universitaria.

1. **Tabla Principal**: Elige `Carreras`.
2. **JOIN**: Agrega un JOIN con `Alumnos` donde `Carreras.id = Alumnos.id_carrera`.
3. **Columnas**:
   - Selecciona `Carreras.nombre` (Agregación: `NONE`).
   - Selecciona `Alumnos.id` (Agregación: `COUNT`, Alias: `total_alumnos`).
4. **Ejecutar**: Haz clic en **`▶ Ejecutar Consulta`**.
5. **Resultado SQL Generado**:
```sql
SELECT 
  Carreras.nombre, 
  COUNT(Alumnos.id) AS total_alumnos 
FROM Carreras 
INNER JOIN Alumnos ON Carreras.id = Alumnos.id_carrera 
GROUP BY Carreras.nombre;
```

---

## ⌨️ 2. Editor SQL Libre

El **Editor SQL Libre** te brinda control total mediante una consola con resaltado de código SQL (CodeMirror 6).

### A. Escribir y Ejecutar Consultas
1. Haz clic en el área de código del editor e ingresa cualquier instrucción SQL válida para SQLite (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE INDEX`, etc.).
2. Haz clic en el botón azul **`▶ Ejecutar (Ctrl+Enter)`** (o presiona la combinación de teclas <kbd>Ctrl</kbd> + <kbd>Enter</kbd>).

---

### B. Plantillas y Snippets Didácticos
En la barra superior del editor encontrarás botones para cargar ejemplos rápidos de código:
- **`Consulta con JOIN`**: Carga un `SELECT` multicapa entre `Alumnos` y `Carreras`.
- **`Explorar sqlite_master`**: Muestra las tablas e índices creados en el esquema con la consulta:
```sql
SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'index');
```

---

### C. Resultados, Historial y Exportación a CSV
1. **Grilla de Resultados**: Muestra las filas devueltas, cantidad de registros y el tiempo de ejecución en milisegundos (`ms`).
2. **Exportar a CSV**: Haz clic en el botón **`Download` (Exportar a CSV)** para descargar la tabla de resultados devuelta a tu computadora/celular como archivo `.csv`.
3. **Copiar Consulta**: Haz clic en **`Copiar Consulta`** para copiar el código SQL al portapapeles.
4. **Historial de Consultas**: Haz clic en el botón **`Clock` (Historial)** para desplegar la lista de las últimas 15 consultas ejecutadas en la sesión activa y recargar cualquier consulta previa con un solo clic.
