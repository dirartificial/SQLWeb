# Manual de Usuario: Simulador Web de Base de Datos (LibreOffice Base Web)

Bienvenido al manual de usuario del **Simulador Web de Base de Datos**, una aplicación web interactiva y pedagógica diseñada especialmente para estudiantes de la *Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial*.

Este simulador recrea las capacidades fundamentales de herramientas como **LibreOffice Base** o **Microsoft Access**, permitiéndote aprender y practicar modelado relacional, carga de datos, consultas SQL e informes, corriendo **100% en tu navegador** mediante tecnología **SQLite WebAssembly (WASM)** e **IndexedDB**.

---

## 📚 Estructura de la Documentación

El manual está dividido por pantallas y módulos funcionales. Puedes consultar cada sección haciendo clic en los enlaces a continuación:

| Archivo | Módulo / Pantalla | Descripción |
| :--- | :--- | :--- |
| 📄 [01-entidades.md](file:///C:/Users/guill/OneDrive/Documentos/Javascript/SQLWeb/doc/01-entidades.md) | **1. Diseñador de Entidades (Tablas)** | Creación de tablas mediante el asistente guiado, tipos de datos, claves primarias (PK), claves foráneas (FK/relaciones), edición de estructura, visualización de DDL, creación de índices y eliminación. |
| 📄 [02-formularios-carga.md](file:///C:/Users/guill/OneDrive/Documentos/Javascript/SQLWeb/doc/02-formularios-carga.md) | **2. Formularios de Carga** | Inserción de registros guiada según el tipo de columna, validaciones en tiempo real (NOT NULL, FK), edición (UPDATE), búsqueda/filtrado y eliminación (DELETE). |
| 📄 [03-consultas.md](file:///C:/Users/guill/OneDrive/Documentos/Javascript/SQLWeb/doc/03-consultas.md) | **3. Consultas (SQL)** | Uso del **Asistente Visual (Query Builder)** para proyecciones, funciones de agregación (`COUNT`, `SUM`, `AVG`), `GROUP BY`, `HAVING`, `WHERE` y `JOINs` automáticos; y uso del **Editor SQL Libre** con historial y exportación a CSV. |
| 📄 [04-informes-reportes.md](file:///C:/Users/guill/OneDrive/Documentos/Javascript/SQLWeb/doc/04-informes-reportes.md) | **4. Informes y Reportes** | Generación de reportes imprimibles/PDF a partir de tablas o consultas avanzadas (copiadas desde el editor de consultas), selección de columnas, agrupamiento con subtotales y exportación. |
| 📄 [05-consola-wasm-almacenamiento.md](file:///C:/Users/guill/OneDrive/Documentos/Javascript/SQLWeb/doc/05-consola-wasm-almacenamiento.md) | **0. Consola WASM y Almacenamiento** | Qué es el motor SQLite WebAssembly, cómo usar la Consola de Verificación, persistencia local en IndexedDB, exportación/importación de archivos `.sqlite`, cambio de nombre de BD y sincronización docente. |

---

## 🚀 Arquitectura General y Navegación

### Barra Superior (Cabecera)
En la parte superior de la pantalla siempre encontrarás:
1. **Nombre de la Base de Datos**: Muestra el nombre activo. Puedes editarlo haciendo clic en el ícono del **Lápiz** (✏️).
2. **Indicador de Motor WASM**: Muestra la etiqueta `WASM` y la luz de estado del motor SQLite (`SQLite Activo` en verde).
3. **Botón de Almacenamiento**: Muestra el estado del guardado automático en el navegador (IndexedDB) y da acceso al modal de gestión de archivos `.sqlite`.

### Barra de Navegación por Pestañas
En la parte superior (computadoras y tablets) o en el menú inferior (celulares), puedes cambiar entre los módulos principales:
- **1. Entidades (Tablas)**
- **2. Formularios de Carga**
- **3. Consultas (SQL)**
- **4. Informes / Reportes**
- **0. Consola WASM**

---

> [!NOTE]
> No requiere conexión a internet constante ni instalación de software. Todo el procesamiento de la base de datos se realiza dentro de tu dispositivo.
