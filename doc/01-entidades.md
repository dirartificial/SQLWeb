# Manual de Usuario: Pestaña 1 - Diseñador de Entidades (Tablas)

El **Diseñador de Entidades** te permite definir la estructura de tus tablas de base de datos relacionales sin necesidad de escribir código SQL manualmente. Además, genera en tiempo real el código **DDL** (`CREATE TABLE`) para que comprendas cómo se traducen tus diseños visuales al lenguaje SQL estándar.

---

## 📌 Acceso al Módulo

Para ingresar a este módulo:
1. Ubica la barra de navegación principal en la parte superior de la pantalla.
2. Haz clic en el botón **`1. Entidades (Tablas)`** (o en la barra inferior táctil en móviles, presiona **`Tablas`**).

---

## 🛠️ 1. Cargar el Ejemplo Didáctico

Si estás comenzando y tu base de datos está vacía, puedes cargar un esquema preconfigurado para explorar cómo funcionan las tablas y sus relaciones.

### Pasos paso a paso:
1. En la pantalla principal del diseñador, ubica el botón azul con un destello **`Cargar Ejemplo Didáctico`** (ubicado en la esquina superior derecha o en la tarjeta de bienvenida).
2. Haz clic en **`Cargar Ejemplo Didáctico`**.
3. El sistema creará automáticamente dos tablas en la memoria SQLite y las poblará con datos reales de prueba:
   - **`Carreras`**: con las columnas `id` (PK), `nombre` (TEXT) y `duracion_anios` (INTEGER), poblada con **5 carreras** universitarias/técnicas.
   - **`Alumnos`**: con las columnas `id` (PK), `nombre` (TEXT), `email` (TEXT), `fecha_ingreso` (DATE) y `id_carrera` (FK que apunta a `Carreras.id`), poblada con **50 alumnos** vinculados a sus respectivas carreras.
4. Verás una notificación verde confirmando: *"¡Esquema de ejemplo (5 carreras y 50 alumnos con FK) creado con éxito!"*.

---

## ➕ 2. Crear una Nueva Entidad (Asistente Guiado Paso a Paso)

Para diseñar una tabla personalizada desde cero:

### Paso 1: Iniciar el Asistente
1. Haz clic en el botón azul **`+ Nueva Entidad`** (o **`Crear Primera Entidad`**).
2. Se abrirá el **Asistente de Creación de Entidad (Wizard)**.

---

### Paso 2: Nombre de la Entidad (Paso 1 del Wizard)
1. En el campo titulado **`Nombre de la Entidad / Tabla`**, escribe el nombre de tu tabla (por ejemplo: `Productos`, `Ventas` o `Profesores`).
   - *Reglas de validación*: El nombre debe comenzar con una letra y contener únicamente letras, números o guiones bajos `_` (sin espacios ni caracteres especiales). No se admiten nombres duplicados.
2. Haz clic en el botón azul **`Siguiente: Atributos →`** situado en la esquina inferior derecha.

---

### Paso 3: Definir Atributos / Columnas (Paso 2 del Wizard)

En este paso agregarás las columnas que componen tu tabla.

#### A. Sugerencia rápida de Clave Primaria (ID)
- Haz clic en el botón flotante **`+ Sugerir ID por defecto`** para añadir de manera instantánea una columna llamada `id`, de tipo `INTEGER`, marcada como **Clave Primaria (PK)** y **Obligatorio (NN)**.

#### B. Agregar una columna personalizada:
1. En la sección **"Agregar nuevo atributo"**:
   - **Nombre del atributo**: Escribe el nombre de la columna (ej. `precio`, `email`, `fecha_nacimiento`).
   - **Tipo de Dato**: Despliega el menú selector y elige el tipo apropiado:
     - `INTEGER`: Números enteros (ej. edad, cantidad, ID).
     - `TEXT`: Cadenas de texto (ej. nombres, correos, descripciones).
     - `REAL`: Números decimales / flotantes (ej. precio, salario, promedio).
     - `DATE`: Fechas en formato ISO `YYYY-MM-DD`.
     - `BOOLEAN`: Valores lógicos `TRUE` (1) o `FALSE` (0).
   - **Casillas de verificación**:
     - **Clave Primaria (PK)**: Marca esta casilla si la columna identifica unívocamente a cada registro de la tabla.
     - **Obligatorio (NOT NULL)**: Marca esta casilla si el campo no permite valores nulos (vacíos).
2. Haz clic en el botón verde **`+ Agregar Atributo`**.
3. La columna aparecerá listada en la tabla inferior.

#### C. Gestionar y Reordenar Columnas:
- **Subir / Bajar posición**: En la lista de columnas agregadas, haz clic en las flechas **`▲` (Subir)** o **`▼` (Bajar)** para cambiar la posición física de la columna en el `CREATE TABLE`.
- **Cambiar tipo de dato sobre la marcha**: Puedes cambiar el tipo de dato de una columna agregada seleccionando otro tipo directamente en la lista.
- **Eliminar atributo**: Haz clic en el ícono del **Bote de Basura** (🔴) al lado de la columna que desees quitar.

4. Una vez definidas todas las columnas (debe haber al menos una clave primaria), haz clic en **`Siguiente: Relaciones →`**.

---

### Paso 4: Configurar Relaciones y Claves Foráneas (Paso 3 del Wizard)

Las **Claves Foráneas (FK)** permiten vincular la tabla que estás creando con otra tabla existente (por ejemplo, relacionar `Alumnos.id_carrera` con `Carreras.id`).

1. En la sección **"Definir Clave Foránea (FK)"**:
   - **Columna en esta entidad**: Selecciona la columna de tu nueva tabla que actuará como clave foránea (ej. `id_carrera`).
   - **Tabla referenciada (Destino)**: Selecciona la tabla origen existente a la que apuntará (ej. `Carreras`).
   - **Columna referenciada (Destino)**: Selecciona la columna clave de la tabla origen (ej. `id`).
2. Haz clic en el botón azul **`+ Vincular Relación`**.
3. Aparecerá un recuadro azul confirmando la relación: `[EstaTabla].[columna] → [TablaDestino].[columna]`.
4. Si te equivocaste, puedes eliminar la relación haciendo clic en **`Quitar`**.
5. Haz clic en el botón azul **`Siguiente: Vista Previa DDL →`**.

---

### Paso 5: Vista Previa DDL y Confirmación (Paso 4 del Wizard)
1. El asistente generará el código SQL exacto (`CREATE TABLE ...`).
2. Revisa el código SQL desplegado en pantalla.
3. Haz clic en el botón verde **`✓ Crear Entidad en SQLite`**.
4. ¡Listo! La tabla quedará creada en la memoria activa y lista para usar.

---

## ✏️ 3. Editar una Entidad Existente

Si necesitas modificar la estructura de una tabla que ya habías creado:

1. En la tarjeta de la tabla correspondiente, haz clic en el botón **`Pencil` (Editar Entidad)** ubicado en la esquina superior derecha o en el pie de la tarjeta.
2. Se desplegará el modal **"Editar Estructura de Entidad"**:
   - **Renombrar Entidad**: Edita el campo con el nombre de la tabla y haz clic en **`Guardar Nombre`**.
   - **Renombrar Columna**: Haz clic en el ícono del **Lápiz** al lado de cualquier columna, ingresa el nuevo nombre y presiona el tilde verde **`✓`**.
   - **Cambiar Tipo de Dato**: Selecciona un nuevo tipo (`INTEGER`, `TEXT`, etc.) en el selector de la columna deseada.
   - **Reordenar Posición**: Utiliza las flechas **`▲`** y **`▼`** para modificar el orden de las columnas.
   - **Agregar Nuevas Columnas**: Haz clic en **`+ Agregar Nueva Columna`**, completa el nombre y tipo, y presiona **`Agregar Columna`**.
   - **Eliminar Columna**: Haz clic en el ícono del **Bote de Basura** al lado de una columna y confirma la acción.
3. Haz clic en **`Guardar Cambios de Estructura`** al finalizar.

---

## 🔍 4. Ver Sentencia DDL (CREATE TABLE)

1. En la tarjeta de la entidad deseada, haz clic en el botón **`Code2` (Ver DDL)**.
2. Se abrirá una ventana emergente que muestra el SQL exacto usado para crear la tabla.
3. Haz clic en el botón **`Copiar DDL`** para guardar la instrucción SQL en tu portapapeles.

---

## ⚡ 5. Creación de Índices (`CREATE INDEX`)

### ¿Qué es un Índice y para qué sirve?
Un **Índice** es una estructura de datos secundaria que el motor de base de datos (SQLite) utiliza para acelerar drásticamente las consultas (`SELECT ... WHERE ...`), evitar escaneos completos de tablas (*Full Table Scan*) y garantizar la unicidad de valores cuando sea necesario (`UNIQUE INDEX`).

### ¿Cuándo debes crear un índice?
- En columnas que se utilicen frecuentemente en filtros `WHERE` (ej. `email`, `dni`, `apellido`).
- En columnas utilizadas para unir tablas (`JOIN`), como las **Claves Foráneas (FK)**.
- En columnas donde necesites asegurar que no existan valores duplicados (`UNIQUE`).

### ¿Cómo crear un Índice en el Simulador?
Los índices se crean mediante sentencias SQL DDL. Para ejecutar la creación de un índice:

1. Dirígete a la pestaña **`3. Consultas (SQL)`** -> sub-pestana **`Editor SQL Libre`** (o a la **`0. Consola WASM`**).
2. Escribe la sentencia SQL para crear el índice.

#### Ejemplo 1: Índice estándar para acelerar búsquedas por columna
```sql
CREATE INDEX idx_alumnos_carrera 
ON Alumnos(id_carrera);
```

#### Ejemplo 2: Índice único para evitar correos duplicados
```sql
CREATE UNIQUE INDEX idx_alumnos_email 
ON Alumnos(email);
```

#### Ejemplo 3: Índice compuesto sobre múltiples columnas
```sql
CREATE INDEX idx_alumnos_carrera_nombre 
ON Alumnos(id_carrera, nombre);
```

3. Haz clic en el botón verde **`Ejecutar Consulta (Ctrl+Enter)`**.
4. Recibirás la confirmación: *"Consulta ejecutada con éxito"*. Puedes verificar los índices creados ejecutando:
```sql
SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index';
```

---

## 🗑️ 6. Eliminar una Entidad (`DROP TABLE`)

1. En la tarjeta de la tabla que deseas borrar, haz clic en el ícono del **Bote de Basura** (🔴).
2. Se abrirá un modal de advertencia indicando la instrucción SQL `DROP TABLE "NombreTabla";`.
3. Haz clic en **`Sí, Eliminar Tabla`**.

> [!WARNING]
> Si la tabla contiene claves primarias que son referenciadas por claves foráneas de otra tabla, SQLite rechazará la eliminación para mantener la integridad referencial. Deberás eliminar primero las tablas secundarias (hijas).
