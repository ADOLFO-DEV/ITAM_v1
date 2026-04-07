# ITAM v1 (IT Asset Management) Backend API

## 📌 Propósito del Proyecto

El proyecto **ITAM (IT Asset Management)** tiene como objetivo principal gestionar, rastrear y administrar de manera eficiente los activos tecnológicos (hardware y líneas telefónicas) asignados a los empleados de la organización.

Está diseñado para ofrecer un control estricto sobre el ciclo de vida de cada activo (alta, asignación, modificación y baja), garantizando trazabilidad y auditoría completa (Forense) de cada movimiento. Permite segmentación geográfica por centros de costo y tiendas.

### Características Principales:

- **Gestión de Roles y Seguridad:** Control de acceso basado en roles (`SUPERADMIN`, `ADMIN`, `VIEWER`).
- **Control de Empleados:** Administración del personal con segmentación geográfica (Distrito, Tienda, Centro de Costos).
- **Control de Inventario (Service Slots):** Trazabilidad de cada dispositivo (modelos, IMEI, facturas, hardware general) y línea telefónica (SIM Card, Proveedor, por defecto TELCEL).
- **Historial Forense (AuditLog):** Registro inmutable de cada cambio realizado en los activos para fines de auditoría, documentando quién, cuándo y qué campo cambió exactamente.

---

## 🛠️ Stack Tecnológico

- **Entorno de Ejecución:** Node.js
- **Framework Web:** Express.js (v5)
- **ORM:** Prisma Client
- **Base de Datos:** SQLite (Perfecto para desarrollo rápido e integrado, fácilmente migrable a PostgreSQL/MySQL gracias a Prisma).
- **Herramientas:** Nodemon, CORS, Dotenv.

---

## 🚀 Guía de Instalación y Puesta en Marcha

### 1. Requisitos Previos

- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### 2. Instalación de Dependencias

Asegúrate de estar en el directorio raíz del proyecto (`ITAM_v1`) y ejecuta:

```bash
npm install
```

### 3. Configuración del Entorno

Debes verificar que en la raíz del proyecto exista el archivo `.env`. Este archivo debe contener al menos la URL local para la base de datos SQLite:

```env
DATABASE_URL="file:./dev.db"
```

_(Puedes añadir otras variables de entorno como el `PORT` en caso de que tu aplicación lo requiera)._

### 4. Inicialización de la Base de Datos (Prisma)

Para generar el cliente de Prisma y sincronizar el esquema con tu base de datos local SQLite (`dev.db`), ejecuta los siguientes scripts en orden:

Generar los artefactos del cliente de Prisma:

```bash
npm run prisma:generate
```

Sincronizar el esquema de la base de datos (crea o actualiza las tablas sin usar migraciones formales durante desarrollo rápido):

```bash
npm run prisma:push
```

### 5. Iniciar el Servidor

Una vez instaladas las dependencias y lista la base de datos, tienes dos maneras de arrancar la API:

**Modo Desarrollo (con auto-recarga usando Nodemon):**

```bash
npm run dev
```

**Modo Estándar:**

```bash
npm start
```

La aplicación leerá tu punto de entrada `src/app.js` y el servidor quedará a la escucha de peticiones.

---

## 📂 Estructura Principal del Proyecto

```text
ITAM_v1/
├── src/
│   ├── prisma/
│   │   └── schema.prisma    # Definición de la base de datos, relaciones y modelos
│   ├── app.js               # Punto de entrada de la aplicación, configuración de Express
│   └── ...                  # (Controladores, Rutas y otras capas)
├── test_api.sh              # Script Bash con ejemplos de peticiones a la API
├── .env                     # Variables de entorno secretas y de config locales
└── package.json             # Registro de dependencias (Express, Prisma, etc.) y NPM Scripts
```

## 📝 Notas de Desarrollo

Si realizas un cambio en la estructura de la base de datos modificando el archivo `src/prisma/schema.prisma` (añadir campos o modelos nuevos), es imprescindible que apliques los cambios ejecutando:

```bash
npm run prisma:push
npm run prisma:generate
```

node scripts/sync-console.js -- Comando para sincronizar el headcount desde la consola

node scripts/seed.js -- Comando para sembrar la base de datos con datos de prueba

npx prisma migrate dev --name init -- Comando para crear la base de datos

npx prisma studio -- Comando para abrir la interfaz de administración de la base de datos
