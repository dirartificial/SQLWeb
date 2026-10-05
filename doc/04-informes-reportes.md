# Manual de Usuario: Pestaña 4 - Informes y Reportes

El módulo **Informes / Reportes** te permite presentar la información procesada en la base de datos en un formato formal impreso o descargable en PDF, emulando la funcionalidad de Informes de LibreOffice Base.

---

## 📌 Acceso al Módulo

1. En la barra de navegación superior, haz clic en el botón **`4. Informes / Reportes`** (o en la barra inferior móvil, presiona **`Reportes`**).

---

## ⚙️ 1. Elegir el Origen de Datos del Reporte

Puedes generar un informe desde dos orígenes distintos:

### Opción A: Desde una Tabla Directa
1. En el selector **`Origen de Datos:`**, elige **`Tabla Directa`**.
2. En el menú desplegable adyacente, selecciona la tabla que deseas reportar (ej. `Alumnos` o `Carreras`).
3. El generador leerá de inmediato todos los registros y columnas disponibles.

---

### Opción B: Desde una Consulta SQL Personalizada (Pasos Paso a Paso)

Si necesitas un reporte complejo que incluya datos combinados de varias tablas (`JOIN`), campos calculados o filtros especiales, debes construir la consulta primero y transferirla al módulo de informes:

#### Pasos a seguir:
1. **Dirígete al Módulo de Consultas**:
   - Haz clic en la pestaña **`3. Consultas (SQL)`**.
2. **Crea o prueba tu consulta**:
   - Diseña tu consulta mediante el **Asistente Visual** o escríbela en el **Editor SQL Libre**.
   - Ejemplo de consulta para informe:
   ```sql
   SELECT 
     Alumnos.nombre AS Alumno,
     Alumnos.email AS Email,
     Carreras.nombre AS Carrera,
     Carreras.duracion_anios AS Duracion
   FROM Alumnos
   INNER JOIN Carreras ON Alumnos.id_carrera = Carreras.id;
   ```
3. **Copia la consulta**:
   - En el **Editor SQL Libre**, haz clic en el botón **`Copiar Consulta`** (o selecciona el texto y presiona <kbd>Ctrl</kbd> + <kbd>C</kbd>).
4. **Vuelve al Módulo de Informes**:
   - Haz clic en la pestaña **`4. Informes / Reportes`**.
5. **Pega y procesa la consulta**:
   - En el selector **`Origen de Datos:`**, selecciona la opción **`Consulta SQL Personalizada`**.
   - Pega tu código SQL en el área de texto presentada.
   - Haz clic en el botón verde **`▶ Procesar Consulta para Informe`**.
   - Verás cargadas todas las columnas devueltas por la consulta SQL.

> [!TIP]
> Si tienes cargadas las tablas de ejemplo (`Alumnos` y `Carreras`), puedes hacer clic en el botón con destello **`✨ Cargar Reporte Didáctico (JOIN Alumnos + Carreras)`** para autocompletar esta configuración de inmediato.

---

## 🎨 2. Personalizar la Estructura del Informe

### A. Cambiar el Título del Reporte
- En el campo **`Título del Informe:`**, escribe el título institucional que aparecerá en el encabezado de la hoja (ej. *"Nómina Oficial de Alumnos Matriculados"*).

### B. Seleccionar Columnas a Mostrar
- En la sección **"Columnas a Incluir en la Hoja"**, verás botones tipo *píldora* para cada columna.
- Haz clic en una columna para activarla o desactivarla del informe impreso. Las columnas activas se resaltarán en color azul.

---

## 📊 3. Configurar Agrupamiento y Subtotales de Resumen

Para organizar la información en secciones agrupadas (igual que un informe agrupado en LibreOffice Base):

1. Marca la casilla de verificación **`Agrupar filas por una columna`**.
2. **Columna de Agrupamiento**: Selecciona el campo por el cual agrupar las filas (ej. `Carrera`).
3. **Cálculo de Subtotales**:
   - **Operación de Resumen**: Elige entre `COUNT` (conteo de registros), `SUM` (suma de valores) o `AVG` (promedio).
   - **Columna a resumir**: Si seleccionas `SUM` o `AVG`, elige la columna numérica sobre la cual aplicar el cálculo (ej. `Duracion`).
4. La vista previa del informe se reestructurará dividiendo la tabla en bloques según cada grupo y agregando una fila de **Subtotal del Grupo**.

---

## 🖨️ 4. Vista Previa y Exportación a PDF / Impresión

1. Desplázate hacia la mitad inferior de la pantalla para observar la **Vista Previa de la Hoja de Informe**.
2. La hoja incluirá:
   - Encabezado con el título configurado y la fecha/hora de generación.
   - Tabla estilizada con los datos formateados y alineados.
   - Subtotales por grupo si activaste el agrupamiento.
   - Pie de página institucional.
3. Para exportar o imprimir:
   - Haz clic en el botón azul **`Printer` (Imprimir / Exportar a PDF)** ubicado en el panel de control superior.
   - Se abrirá la ventana de impresión nativa de tu navegador web.
   - En el destino de impresora, selecciona **"Guardar como PDF"** (o elige tu impresora física) y haz clic en **Guardar**.

---

> [!NOTE]
> La vista de impresión utiliza hojas de estilo CSS optimizadas (`@media print`), por lo que los botones, menús y barras de navegación de la aplicación web se ocultarán automáticamente al imprimir o generar el PDF.
