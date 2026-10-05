# Manual de Usuario: Pestaña 2 - Formularios de Carga

El módulo **Formularios de Carga** simula la funcionalidad de entrada de datos asistida de LibreOffice Base. Te permite insertar, modificar (UPDATE), buscar y eliminar (DELETE) registros en tus tablas mediante un formulario interactivo que se adapta automáticamente a la estructura y tipos de datos de cada entidad.

---

## 📌 Acceso al Módulo

Para ingresar a este módulo:
1. Haz clic en el botón **`2. Formularios de Carga`** de la barra de navegación superior (o presiona **`Carga`** en el menú inferior móvil).

---

## 📋 1. Seleccionar la Tabla de Trabajo

1. En la parte superior de la pantalla, ubica el selector desplegable **`Tabla de Trabajo:`**.
2. Haz clic en el menú y selecciona la tabla en la que deseas cargar o consultar datos (ej. `Carreras` o `Alumnos`).
3. El sistema inspeccionará automáticamente los tipos de datos y restricciones de la tabla seleccionada y construirá el formulario correspondiente.

---

## ➕ 2. Insertar un Nuevo Registro (`INSERT INTO`)

### Pasos paso a paso:
1. Revisa los campos de entrada generados automáticamente en el formulario:
   - **Campos de Texto (`TEXT`)**: Se renderizan como cajas de texto tradicionales.
   - **Campos Numéricos (`INTEGER` / `REAL`)**: Permiten ingresar números enteros o decimales. Si una columna `INTEGER PRIMARY KEY` está vacía, SQLite le asignará automáticamente un ID autoincremental.
   - **Campos de Fecha (`DATE`)**: Presentan un selector de fecha de calendario (`YYYY-MM-DD`).
   - **Campos Booleano (`BOOLEAN`)**: Se renderizan como una casilla de verificación (*checkbox*).
   - **Campos de Clave Foránea (`FK`)**: Se convierten automáticamente en un **Menú Desplegable (`<select>`)** que muestra los registros legibles existentes de la tabla referenciada (por ejemplo, al elegir el `id_carrera` de un alumno, el desplegable mostrará *"1 - Licenciatura en Ciencia de Datos"* en lugar de un número suelto).

2. Completa los valores de los campos deseados. Los campos marcados con la etiqueta roja **`NOT NULL`** son obligatorios.
3. Haz clic en el botón azul con ícono de disco **`Guardar Registro`**.
4. Si la inserción es exitosa:
   - Verás un mensaje verde de confirmación: *"¡Registro insertado correctamente en la tabla!"*.
   - El formulario se limpiará automáticamente.
   - El nuevo registro aparecerá reflejado de inmediato en la grilla de datos ubicada debajo del formulario.

---

## ✏️ 3. Modificar / Editar un Registro Existente (`UPDATE`)

Si necesitas corregir la información de un registro cargado previamente:

1. Desplázate hacia la grilla de registros ubicada en la mitad inferior de la pantalla.
2. Localiza la fila del registro que deseas modificar.
3. Haz clic en el botón de la columna **Acciones**: el ícono azul de **`Lápiz` (Editar)**.
4. El formulario superior cambiará automáticamente al **Modo Edición** (destacado con un encabezado amarillo de aviso: *"Editando Registro Existente"*).
5. Los campos del formulario se rellenarán automáticamente con los datos actuales del registro seleccionado.
6. Realiza las modificaciones requeridas en los campos correspondientes.
7. Haz clic en el botón amarillo **`Actualizar Registro`**.
8. Verás el mensaje verde de éxito: *"¡Registro actualizado exitosamente en SQLite!"* y la grilla actualizará sus datos en tiempo real.
9. Si deseas descartar la edición sin guardar, haz clic en el botón gris **`Cancelar Edición`**.

---

## 🔍 4. Búsqueda y Filtrado de Registros en la Grilla

Cuando tienes muchos registros cargados en una tabla:

1. Ubica la caja de búsqueda titulada **`Buscar registros...`** sobre el margen derecho de la grilla de datos.
2. Escribe cualquier término (nombre, email, ID, etc.).
3. La grilla filtrará instantáneamente las filas mostrando únicamente aquellas que coincidan con tu búsqueda.

---

## 🗑️ 5. Eliminar un Registro (`DELETE FROM`)

1. En la grilla de datos, localiza la fila del registro que deseas eliminar.
2. Haz clic en el ícono rojo del **Bote de Basura** (Eliminar) en la columna de Acciones.
3. Aparecerá un cuadro modal de confirmación mostrando la clave primaria del registro.
4. Haz clic en el botón **`Eliminar Registro`**.
5. El registro será removido permanentemente de la base de datos SQLite.

---

## ⚠️ 6. Manejo de Errores y Validaciones de Integridad

El simulador valida las restricciones de base de datos antes y durante la ejecución en SQLite. En caso de cometer un error, se mostrará un mensaje descriptivo en color rojo:

- **Violación de Clave Primaria (Duplicada)**:
  - *Mensaje*: `UNIQUE constraint failed: Tabla.id`
  - *Solución*: Estás intentando ingresar un ID que ya pertenece a otro registro. Cambia el ID o déjalo en blanco si es autoincremental.
- **Campo Obligatorio Vacío (`NOT NULL`)**:
  - *Mensaje*: `NOT NULL constraint failed: Tabla.columna`
  - *Solución*: Ingresa un valor en el campo obligatorio señalizado antes de guardar.
- **Violación de Clave Foránea (`FOREIGN KEY`)**:
  - *Mensaje*: `FOREIGN KEY constraint failed`
  - *Solución*: Ocurre cuando intentas vincular un registro con un ID de tabla padre que no existe o ha sido eliminado. Asegúrate de seleccionar una opción válida del desplegable FK.
