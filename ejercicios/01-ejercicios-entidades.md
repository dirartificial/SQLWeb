# Guía de Ejercicios Prácticos: Diseñador de Entidades (Tablas)

Este documento contiene una serie de ejercicios prácticos diseñados para poner a prueba y afianzar los conocimientos sobre el uso del **Diseñador de Entidades**, la definición de estructuras relacionales en SQLWeb y la generación de sentencias **DDL** (`CREATE TABLE`, `CREATE INDEX`, `DROP TABLE`).

---

## 🎯 Objetivos de Aprendizaje

Al finalizar estos ejercicios, el estudiante será capaz de:
1. Navegar por el simulador SQLWeb y cargar esquemas didácticos de prueba.
2. Diseñar modelos entidad-relación e implementarlos paso a paso usando el asistente gráfico (Wizard).
3. Seleccionar adecuadamente los tipos de datos en SQLite (`INTEGER`, `TEXT`, `REAL`, `DATE`, `BOOLEAN`) y aplicar restricciones de integridad (`PRIMARY KEY`, `NOT NULL`, `FOREIGN KEY`).
4. Modificar y refactorizar tablas existentes (renombrar, agregar campos, cambiar tipos de datos y reordenar).
5. Crear y verificar índices de base de datos (`CREATE INDEX`, `UNIQUE INDEX`, índices compuestos) desde la Consola SQL.
6. Comprender el comportamiento del motor SQLite ante la eliminación de entidades (`DROP TABLE`) y las restricciones de integridad referencial.

---

## 📋 Nivel 1: Exploración Inicial y Esquema Didáctico

### Ejercicio 1.1: Carga e Inspección de Esquema Base
**Objetivo:** Familiarizarse con la interfaz y reconocer estructuras relacionales preconfiguradas.

**Consignas:**
1. Ingresa a la pestaña **`1. Entidades (Tablas)`**.
2. Haz clic en el botón azul **`Cargar Ejemplo Didáctico`**.
3. Observa las dos tablas creadas en el sistema: `Carreras` y `Alumnos`.
4. Para la tabla `Alumnos`:
   - Haz clic en **`Code2` (Ver DDL)**.
   - Copia la sentencia `CREATE TABLE` generada.
5. Identifica y responde en una hoja de apuntes o documento:
   - ¿Qué columna funciona como **Clave Primaria (PK)** en `Alumnos`?
   - ¿Qué columna actúa como **Clave Foránea (FK)** y a qué tabla/columna apunta?
   - ¿Qué tipo de dato tiene el campo `fecha_ingreso`?

---

## 🛠️ Nivel 2: Creación de Entidades desde Cero (Asistente Guiado)

### Ejercicio 2.1: Sistema de Tienda - Tabla `Categorias`
**Objetivo:** Crear una entidad primaria simple utilizando el asistente guiado paso a paso.

**Consignas:**
1. Haz clic en el botón **`+ Nueva Entidad`**.
2. **Paso 1 (Nombre):** Define el nombre de la entidad como `Categorias`.
3. **Paso 2 (Atributos):**
   - Haz clic en **`+ Sugerir ID por defecto`** para crear el campo `id` (`INTEGER`, PK, NOT NULL).
   - Agrega un atributo llamado `nombre`:
     - **Tipo:** `TEXT`
     - **Obligatorio (NOT NULL):** Sí (marcado).
   - Agrega un atributo llamado `descripcion`:
     - **Tipo:** `TEXT`
     - **Obligatorio (NOT NULL):** No (desmarcado).
4. **Paso 3 (Relaciones):** No agregues relaciones para esta tabla.
5. **Paso 4 (Vista Previa DDL):** Revisa el código `CREATE TABLE` y haz clic en **`✓ Crear Entidad en SQLite`**.

---

### Ejercicio 2.2: Sistema de Tienda - Tabla `Productos` y Relación FK
**Objetivo:** Diseñar una entidad secundaria con múltiples tipos de datos y vincularla mediante Clave Foránea.

**Consignas:**
1. Inicia un nuevo asistente con **`+ Nueva Entidad`** y nombra la tabla como `Productos`.
2. Agrega las siguientes columnas:
   - `id`: `INTEGER`, **PK**, **NOT NULL** (Usa el botón de sugerencia).
   - `codigo_barras`: `TEXT`, **NOT NULL**.
   - `nombre`: `TEXT`, **NOT NULL**.
   - `precio`: `REAL`, **NOT NULL**.
   - `stock`: `INTEGER`, **NOT NULL**.
   - `disponible`: `BOOLEAN`, **NOT NULL**.
   - `id_categoria`: `INTEGER`, **NOT NULL**.
3. En el **Paso 3 (Relaciones)**, configura la siguiente Clave Foránea:
   - **Columna en esta entidad:** `id_categoria`
   - **Tabla referenciada:** `Categorias`
   - **Columna referenciada:** `id`
   - Haz clic en **`+ Vincular Relación`**.
4. En el **Paso 4**, confirma la creación con **`✓ Crear Entidad en SQLite`**.

---

### Ejercicio 2.3: Gestión de Biblioteca - Tablas `Autores` y `Libros`
**Objetivo:** Practicar el diseño completo e independiente de una relación 1 a N.

**Consignas:**
1. Crea la tabla **`Autores`** con la siguiente estructura:
   - `id`: `INTEGER`, PK, NOT NULL.
   - `nombre_completo`: `TEXT`, NOT NULL.
   - `nacionalidad`: `TEXT`.
   - `fecha_nacimiento`: `DATE`.
2. Crea la tabla **`Libros`** con la siguiente estructura:
   - `id`: `INTEGER`, PK, NOT NULL.
   - `titulo`: `TEXT`, NOT NULL.
   - `isbn`: `TEXT`, NOT NULL.
   - `anio_publicacion`: `INTEGER`.
   - `precio_alquiler`: `REAL`.
   - `id_autor`: `INTEGER`, NOT NULL.
3. Establece la relación FK de `Libros.id_autor` apuntando a `Autores.id`.
4. Verifica que ambas tablas queden visibles en la vista del diseñador.

---

## ✏️ Nivel 3: Modificación y Refactorización de Entidades

### Ejercicio 3.1: Actualizar la Estructura de `Productos`
**Objetivo:** Utilizar el modal de edición para reestructurar columnas existentes sin perder la definición.

**Consignas:**
1. En la tarjeta de la entidad `Productos`, haz clic en el botón de edición **`Pencil` (Editar Entidad)**.
2. Realiza los siguientes cambios:
   - Renombra la columna `stock` a `stock_actual`.
   - Cambia el tipo de dato de `disponible` (si deseas reajustarlo) o agrega una nueva columna llamada `fecha_vencimiento` de tipo `DATE`.
   - Agrega una nueva columna llamada `descuento_porcentaje` de tipo `REAL`.
3. Haz clic en las flechas **`▲`** / **`▼`** para mover `descuento_porcentaje` justo después de `precio`.
4. Guarda los cambios haciendo clic en **`Guardar Cambios de Estructura`**.
5. Abre la vista DDL (**`Code2`**) de `Productos` y comprueba cómo varió la sentencia `CREATE TABLE`.

---

## ⚡ Nivel 4: Optimización con Índices (`CREATE INDEX`)

### Ejercicio 4.1: Crear un Índice Estándar para Clave Foránea
**Objetivo:** Crear un índice para acelerar la aceleración de consultas `JOIN` y filtros `WHERE` sobre relaciones.

**Consignas:**
1. Dirígete a la pestaña **`3. Consultas (SQL)`** -> **`Editor SQL Libre`** (o a la **`0. Consola WASM`**).
2. Escribe y ejecuta una sentencia SQL para crear un índice en la columna `id_categoria` de la tabla `Productos`:
   ```sql
   CREATE INDEX idx_productos_categoria ON Productos(id_categoria);
   ```
3. Verifica la respuesta de ejecución.

---

### Ejercicio 4.2: Crear un Índice Único (`UNIQUE INDEX`)
**Objetivo:** Garantizar que no existan valores duplicados en columnas clave de negocio (como correos o códigos de barras).

**Consignas:**
1. En el Editor SQL Libre, crea un índice único para que no se puedan repetir códigos de barra en `Productos`:
   ```sql
   CREATE UNIQUE INDEX idx_productos_codigo ON Productos(codigo_barras);
   ```
2. Crea también un índice único para el `isbn` en la tabla `Libros`.

---

### Ejercicio 4.3: Crear un Índice Compuesto
**Objetivo:** Acelerar búsquedas que filtran simultáneamente por categoría y precio.

**Consignas:**
1. Ejecuta la siguiente consulta para definir un índice compuesto:
   ```sql
   CREATE INDEX idx_productos_cat_precio ON Productos(id_categoria, precio);
   ```
2. Consulta el diccionario de datos del motor para listar todos los índices creados:
   ```sql
   SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index';
   ```

---

## 🗑️ Nivel 5: Eliminación de Entidades e Integridad Referencial

### Ejercicio 5.1: Prueba de Restricción de Integridad en `DROP TABLE`
**Objetivo:** Comprender el orden de borrado en bases de datos relacionales.

**Consignas:**
1. En la pestaña **`1. Entidades (Tablas)`**, intenta eliminar la tabla padre **`Categorias`** haciendo clic en su ícono de **Bote de Basura** (🔴).
2. Observa el mensaje de advertencia y confirma la acción si la interfaz lo permite, o analiza la respuesta de la base de datos si existen restricciones activas.
3. Elimina en primer lugar la tabla hija **`Productos`**.
4. Posteriormente, intenta eliminar la tabla **`Categorias`**.
5. Reflexiona: ¿Por qué es fundamental eliminar primero las tablas secundarias (hijas) antes que las tablas primarias (padres)?

---

## 🏆 Nivel 6: Desafío Integrador Final

### Caso Práctico: "Sistema de Control de Clientes y Ventas"
Diseña el esquema de base de datos completo para un módulo de ventas implementando las siguientes 3 entidades con sus respectivas relaciones e índices:

1. **Tabla `Clientes`**:
   - `id` (INTEGER, PK, NOT NULL)
   - `nombre` (TEXT, NOT NULL)
   - `email` (TEXT, NOT NULL)
   - `telefono` (TEXT)
   - `fecha_registro` (DATE)

2. **Tabla `Ventas`**:
   - `id` (INTEGER, PK, NOT NULL)
   - `folio` (TEXT, NOT NULL)
   - `fecha_venta` (DATE, NOT NULL)
   - `total` (REAL, NOT NULL)
   - `id_cliente` (INTEGER, NOT NULL) -> FK hacia `Clientes(id)`

3. **Tabla `DetalleVentas`**:
   - `id` (INTEGER, PK, NOT NULL)
   - `id_venta` (INTEGER, NOT NULL) -> FK hacia `Ventas(id)`
   - `id_producto` (INTEGER, NOT NULL) -> FK hacia `Productos(id)` (o `Libros(id)`)
   - `cantidad` (INTEGER, NOT NULL)
   - `precio_unitario` (REAL, NOT NULL)

4. **Índices a crear en Consola SQL**:
   - Índice único para el `email` del cliente.
   - Índice único para el `folio` de la venta.
   - Índice estándar en `Ventas(id_cliente)`.

---

## 📖 Solucionario y Referencia (Para Docentes y Autoevaluación)

<details>
<summary>👉 Haz clic aquí para desplegar las respuestas DDL esperadas</summary>

### DDL Ejercicio 2.1 (`Categorias`)
```sql
CREATE TABLE Categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT
);
```

### DDL Ejercicio 2.2 (`Productos`)
```sql
CREATE TABLE Productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_barras TEXT NOT NULL,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL,
    stock INTEGER NOT NULL,
    disponible BOOLEAN NOT NULL,
    id_categoria INTEGER NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id)
);
```

### DDL Ejercicio 2.3 (`Autores` y `Libros`)
```sql
CREATE TABLE Autores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    nacionalidad TEXT,
    fecha_nacimiento DATE
);

CREATE TABLE Libros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    isbn TEXT NOT NULL,
    anio_publicacion INTEGER,
    precio_alquiler REAL,
    id_autor INTEGER NOT NULL,
    FOREIGN KEY (id_autor) REFERENCES Autores(id)
);
```

### DDL Ejercicio 4 (Índices)
```sql
CREATE INDEX idx_productos_categoria ON Productos(id_categoria);
CREATE UNIQUE INDEX idx_productos_codigo ON Productos(codigo_barras);
CREATE UNIQUE INDEX idx_libros_isbn ON Libros(isbn);
CREATE INDEX idx_productos_cat_precio ON Productos(id_categoria, precio);
```

### DDL Nivel 6 (Desafío Integrador)
```sql
CREATE TABLE Clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    fecha_registro DATE
);

CREATE TABLE Ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT NOT NULL,
    fecha_venta DATE NOT NULL,
    total REAL NOT NULL,
    id_cliente INTEGER NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id)
);

CREATE TABLE DetalleVentas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES Ventas(id),
    FOREIGN KEY (id_producto) REFERENCES Productos(id)
);

-- Índices
CREATE UNIQUE INDEX idx_clientes_email ON Clientes(email);
CREATE UNIQUE INDEX idx_ventas_folio ON Ventas(folio);
CREATE INDEX idx_ventas_cliente ON Ventas(id_cliente);
```
</details>
