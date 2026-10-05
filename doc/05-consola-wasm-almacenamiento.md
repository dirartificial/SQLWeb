# Manual de Usuario: Pestaña 0 - Consola WASM y Gestión de Almacenamiento

Esta sección detalla cómo funciona el motor interno de la aplicación basado en **SQLite WebAssembly (WASM)**, el uso de la **Consola de Verificación** y las herramientas para **gestionar la persistencia local en IndexedDB** y exportar/importar archivos `.sqlite`.

---

## ⚡ 1. ¿Qué es SQLite WebAssembly (WASM) y cómo funciona?

Tradicionalmente, las bases de datos SQL requieren un servidor (como MySQL, PostgreSQL o un servidor backend con PHP/Python) para procesar las consultas. 

En este simulador, el motor de base de datos **SQLite ha sido compilado a WebAssembly (WASM)** (utilizando la biblioteca `sql.js`). Esto significa que:
- **Ejecución 100% local**: El motor de base de datos corre directamente en la memoria RAM del navegador web de tu celular, tablet o computadora.
- **Sin necesidad de internet**: Una vez cargada la página, no se requieren servidores ni conexión a internet para crear tablas, insertar datos o ejecutar consultas SQL.
- **Privacidad y Velocidad**: Tus datos nunca viajan por la red sin tu consentimiento; las consultas se ejecutan en milisegundos.

---

## 💻 2. Consola de Verificación del Motor (Pestaña 0 - Consola WASM)

### ¿Para qué sirve?
La **Consola WASM** es un entorno de bajo nivel diseñado para realizar pruebas rápidas directamente sobre el motor SQLite, verificar la versión instalada, diagnosticar fallos o ejecutar sentencias SQL nativas que no requieran interfaz gráfica.

### Pasos para usar la Consola WASM:
1. Haz clic en la pestaña **`0. Consola WASM`** de la barra superior (o **`Motor`** en el menú inferior).
2. Observa el estado del motor en el banner superior: debe indicar **`SQLite Activo`**.

#### A. Probar sentencias rápidas con los botones de ejemplo:
- Haz clic en **`SELECT 1 + 1`**: Carga una prueba matemática simple en el editor.
- Haz clic en **`CREATE + INSERT + SELECT`**: Carga un script SQL completo que crea una tabla, inserta registros y los consulta.
- Haz clic en **`Versión SQLite`**: Carga la consulta `SELECT sqlite_version();`.

#### B. Escribir y ejecutar sentencias SQL arbitrarias:
1. En la caja de texto con fondo oscuro, escribe tus instrucciones SQL.
2. Haz clic en el botón azul **`Ejecutar Consulta`** (o presiona <kbd>Ctrl</kbd> + <kbd>Enter</kbd>).
3. En la tarjeta de resultados inferior verás:
   - El estado de la ejecución (éxito en verde o error en rojo).
   - El tiempo exacto de procesamiento en milisegundos (`ms`).
   - La tabla de resultados devuelta por SQLite.

#### C. Reiniciar la Base de Datos en Memoria:
- Si deseas borrar la base de datos en RAM y empezar de cero, haz clic en el botón **`Reiniciar DB`**.

---

## 💾 3. Gestión de Almacenamiento Local (IndexedDB y Copias `.sqlite`)

Aunque SQLite corre en la memoria volátil del navegador, el simulador incluye un sistema de **persistencia automática en IndexedDB** para que no pierdas tu trabajo al cerrar el navegador o refrescar la página.

### Acceso a la Gestión de Almacenamiento:
1. En la barra superior de la aplicación, haz clic en el botón **`Almacenamiento`** (o **`Guardado en navegador`**).
2. Se abrirá el modal **"Gestión de Almacenamiento y Copias de Seguridad"**.

---

### A. Renombrar la Base de Datos Activa
1. En el modal de almacenamiento, ubica la sección **`Nombre de la Base de Datos`**.
2. Escribe el nuevo nombre (ej. `Trabajo_Practico_1`).
3. Haz clic en el botón azul **`Guardar Nombre`**.
4. Este nombre se utilizará como prefijo al descargar el archivo de base de datos a tu dispositivo.

---

### B. Guardado Manual en IndexedDB
- Aunque el sistema guarda automáticamente tus cambios, puedes forzar un guardado inmediato haciendo clic en el botón verde **`Guardar Ahora en IndexedDB`**.

---

### C. Descargar Copia de Seguridad (`.sqlite`)
Para entregar un trabajo práctico al docente o trasladar tu base de datos a otra computadora o a **LibreOffice Base**:

1. En el modal de almacenamiento, haz clic en el botón azul **`Descargar Copia (.sqlite)`**.
2. El navegador descargará un archivo ejecutable estándar de SQLite (ej. `trabajo_practico_1.sqlite`).
3. Este archivo es **100% compatible** con LibreOffice Base, DB Browser for SQLite, Python, PHP y cualquier herramienta que lea archivos SQLite3.

---

### D. Restaurar / Importar un Archivo `.sqlite`
Si deseas abrir una base de datos previamente guardada o entregada por el docente:

1. En el modal de almacenamiento, ubica la sección **"Importar Archivo SQLite"**.
2. Haz clic en el botón violeta **`Seleccionar Archivo .sqlite`**.
3. Busca y selecciona el archivo `.sqlite` o `.db` de tu dispositivo.
4. El simulador cargará de inmediato la estructura y los datos en la memoria del navegador. Verás un aviso confirmando cuántas tablas fueron restauradas.

---

### E. Reiniciar / Borrar Base de Datos
1. Si deseas eliminar definitivamente todo el contenido guardado en IndexedDB, haz clic en el botón rojo **`Reiniciar Base de Datos`**.
2. Confirma la acción en la pantalla emergente.

---

### F. Seguimiento Docente (Opcional / Telemetría)
Si la institución educativa dispone de un servidor docente para evaluar ejercicios:

1. En el modal de almacenamiento, despliega la sección **`Seguimiento Docente`**.
2. Ingresa tu **Nombre y Apellido**, tu **ID / Legajo de Alumno** y la **URL del Servidor Docente**.
3. Haz clic en **`Enviar Estado al Servidor`**.
4. El sistema enviará una captura de tus DDL y cantidad de registros para que el profesor verifique tu progreso.
