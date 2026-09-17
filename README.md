# Simulador Web de Base de Datos

Simulador web interactivo de base de datos relacional orientado a estudiantes de la **Tecnicatura Superior en Ciencia de Datos e IA**. Diseñado como una alternativa liviana, accesible desde dispositivos móviles y sin necesidad de instalación local, ofreciendo una experiencia pedagógica equivalente a las funcionalidades principales de **LibreOffice Base**.

---

## 📋 Descripción y Objetivo

El objetivo principal es permitir a los estudiantes aprender y practicar los conceptos fundamentales de bases de datos relacionales directamente desde su navegador (celular, tablet o computadora):

1. **Diseño de Entidades**: Creación visual de tablas, definición de atributos, claves primarias y foráneas.
2. **Formularios de Carga**: Entrada guiada de registros con validaciones de integridad referencial.
3. **Consultas SQL y Asistidas**: Ejecución de consultas mediante editor SQL con resaltado de sintaxis o constructor visual de consultas (JOIN, GROUP BY, HAVING, agregaciones).
4. **Informes / Reportes**: Generación y exportación de reportes formateados a PDF.

Todo funciona **100% en el cliente** mediante SQLite compilado a WebAssembly (SQL.js), garantizando privacidad, rapidez y funcionamiento sin servidor obligatorio.

---

## 🛠️ Stack Tecnológico

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Estilos y UI**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) (Iconos)
- **Motor de Base de Datos**: [SQL.js](https://sql.js.org/) (SQLite compilado a WebAssembly)
- **Editor SQL**: [CodeMirror 6](https://codemirror.net/) (`@uiw/react-codemirror`)
- **Persistencia Local**: IndexedDB para conservar la base de datos SQLite entre sesiones
- **Exportación**: Estilos `@media print` / `window.print()` para generación de PDF
- **Backend Opcional**: PHP / MySQL (para monitoreo y seguimiento docente opcional)

---

## 🚀 Funcionalidades Principales

### 🏗️ 1. Diseñador de Entidades
- Creación visual de tablas sin necesidad de escribir código DDL manualmente.
- Definición de columnas con tipos de datos SQLite (`INTEGER`, `TEXT`, `REAL`, `DATE`, `BOOLEAN`).
- Selección de clave primaria (`PK`) y definición de claves foráneas (`FK`) referenciando otras entidades.
- Previsualización del DDL SQL generado (`CREATE TABLE ...`) antes de su ejecución.
- Edición de estructura existente (`ALTER TABLE` / recreación transparente de tabla) para modificar columnas, tipos y relaciones.

### 📝 2. Formularios de Carga de Datos
- Generación automática de formularios de entrada según la estructura de la tabla seleccionada.
- Desplegables inteligentes para claves foráneas (`FK`), mostrando registros legibles de la tabla referenciada.
- Operaciones CRUD completas: Agregar (`INSERT`), Buscar/Modificar (`UPDATE`) y Eliminar (`DELETE`).
- Grilla interactiva de visualización de datos cargados con scroll adaptativo.
- Validaciones en tiempo real para restricciones `NOT NULL`, tipos de datos e integridad referencial.

### 🔍 3. Consultas (SQL Directo y Constructor Visual)
- **Editor SQL Directo**:
  - Resaltado de sintaxis y autocompletado de SQL vía CodeMirror.
  - Ejecución directa contra la base en memoria y visualización tabular de resultados.
  - Retorno detallado de mensajes de error de SQLite para fines didácticos.
  - Historial de consultas ejecutadas en la sesión.
- **Constructor Visual (Query Builder)**:
  - Selección de tablas y detección automática de JOINs mediante FKs.
  - Proyección de columnas con reordenamiento interactivo.
  - Aplicación de funciones de agregación (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`).
  - Cláusula `GROUP BY` autogenerada y filtros combinados mediante `WHERE` y `HAVING`.

### 📊 4. Informes y Reportes
- Creación de reportes limpios a partir de tablas o consultas SQL guardadas.
- Opciones de agrupación y cálculo de subtotales/conteos.
- Previsualización de hoja impresa (encabezado, fecha, formato de reporte).
- Exportación directa a PDF utilizando la función de impresión del navegador.

### 📱 5. Adaptación Móvil y Táctil
- Interfaz completamente responsive diseñada priorizando pantallas táctiles pequeñas (desde 375px).
- Flujos guiados paso a paso (wizards) para evitar la complejidad de diagramas ER en pantallas pequeñas.
- Botones táctiles amplios y tablas con desplazamiento horizontal independiente.

---

## 📁 Estructura del Proyecto

```text
SQLWeb/
├── public/                     # Archivos estáticos y binario WASM de SQL.js
├── src/
│   ├── components/             # Componentes de la interfaz de usuario
│   │   ├── database/           # Gestión de bases de datos e IndexedDB
│   │   ├── entities/           # Diseñador de tablas y DDL
│   │   ├── forms/              # Formularios de carga de datos CRUD
│   │   ├── sql/                # Editor SQL y constructor visual
│   │   └── reports/            # Generador e impresor de informes
│   ├── context/                # Contextos de React (Estado global / SQL.js)
│   ├── services/               # Servicios de SQLite, IndexedDB y API
│   ├── types/                  # Definiciones de tipos TypeScript
│   ├── App.tsx                 # Aplicación principal
│   └── main.tsx                # Punto de entrada Vite/React
├── especificacion-simulador-base-datos.md # Especificación técnica detallada
└── package.json
```

---

## 💻 Instalación y Ejecución Local

### Requisitos Previos
- **Node.js** v18.0.0 o superior
- **npm** (incluido con Node.js)

### Pasos de Instalación

1. Clonar o descargar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd SQLWeb
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre la dirección [http://localhost:5173](http://localhost:5173) en tu navegador.

4. Compilar para producción:
   ```bash
   npm run build
   ```

5. Previsualizar la versión de producción:
   ```bash
   npm run preview
   ```

---

## 📦 Despliegue

La aplicación se compila como un **sitio web estático (SPA)** en la carpeta `dist/`. Puede desplegarse directamente en cualquier servidor web estático (GitHub Pages, Vercel, Netlify, Apache, Nginx, etc.) sin necesidad de configurar un backend Node.js o motor de base de datos en el servidor.

---

## 📄 Licencia

Desarrollado para la Tecnicatura Superior en Ciencia de Datos e IA.
