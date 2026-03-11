# MedPrescribe

Sistema de prescripciones medicas con soporte para tres roles: **Medico**, **Paciente** y **Admin**. El medico crea prescripciones asociadas a un paciente con items digitados manualmente. El paciente visualiza sus prescripciones, puede marcarlas como consumidas y descargarlas en PDF. El admin consulta metricas generales del sistema.

---

## Demo / Despliegue

| Servicio | URL |
|----------|-----|
| Frontend | `https://prescripciones-frontend-git-main-zay-m3s-projects.vercel.app/` |
| Backend / API | `https://appdeprescripciones-production.up.railway.app/` |
| Swagger (documentacion API) | `https://appdeprescripciones-production.up.railway.app/api` |

---

## Stack Tecnologico

| Capa | Tecnologias |
|------|-------------|
| Backend | NestJS 11, Prisma 7, PostgreSQL 14, JWT (access + refresh), Swagger/OpenAPI, pdfkit, qrcode, Helmet, class-validator |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS 4, Zustand 5, Recharts 3, next-themes, sonner |
| Infraestructura | Docker Compose (3 servicios: client, backend, db) |

---

## Arquitectura del Proyecto

```
prueba-tecnica/
├── backend/                    # API REST con NestJS
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de datos
│   │   ├── migrations/         # Migraciones de base de datos
│   │   └── seed.ts             # Datos de prueba
│   ├── src/
│   │   ├── auth/               # Autenticacion, JWT, guards, RBAC
│   │   ├── users/              # Gestion de usuarios
│   │   ├── prescriptions/      # CRUD prescripciones, PDF, QR
│   │   ├── admin/              # Metricas del dashboard
│   │   ├── prisma/             # Servicio de conexion a BD
│   │   └── common/             # Filtros, guards, interceptors
│   ├── Dockerfile
│   └── .env.example
├── client/                     # Frontend con Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/          # Pagina de inicio de sesion
│   │   │   └── (dashboard)/
│   │   │       ├── admin/      # Dashboard de metricas
│   │   │       ├── doctor/     # Listado, detalle y creacion de prescripciones
│   │   │       └── patient/    # Listado, detalle, consumir y descargar PDF
│   │   ├── components/         # Sidebar, Navbar, Pagination, ThemeToggle
│   │   ├── lib/                # Cliente API con refresh automatico, servicios, utilidades
│   │   ├── store/              # Estado global con Zustand (auth, hidratacion)
│   │   └── types/              # Interfaces TypeScript
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml          # Orquestacion de los 3 servicios
├── .env.example                # Variables de la base de datos (Docker)
└── README.md
```

---

## Requisitos Previos

**Con Docker (recomendado):**
- Docker y Docker Compose

**Sin Docker (manual):**
- Node.js >= 22
- PostgreSQL >= 14
- npm

---

## Instalacion y Setup Local

### Con Docker (recomendado)

1. Clonar el repositorio:

```bash
git clone https://github.com/Zay-M3/app_de_prescripciones.git
cd prueba-tecnica
```

2. Crear los archivos de entorno a partir de los ejemplos:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp client/.env.example client/.env
```

3. Levantar los servicios:

```bash
docker compose up --build
```

4. En otra terminal, ejecutar las migraciones y el seed:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

5. Acceder a la aplicacion:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api |
| PostgreSQL | localhost:5432 (usuario: `postgrest`, password: `postgrest`) |

### Sin Docker (manual)

1. Clonar el repositorio e instalar dependencias:

```bash
git clone https://github.com/Zay-M3/app_de_prescripciones.git
cd prueba-tecnica

cd backend && npm install
cd ../client && npm install
```

2. Crear los archivos de entorno:

```bash
cp backend/.env.example backend/.env
cp client/.env.example client/.env
```

3. Editar `backend/.env` y cambiar `DATABASE_URL` para apuntar a tu PostgreSQL local:

```
DATABASE_URL=postgresql://usuario:password@localhost:5432/prueba_tecnica?schema=public
```

4. Ejecutar migraciones y seed:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

5. Iniciar los servicios:

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## Variables de Entorno

### Raiz (`.env`) - Configuracion de PostgreSQL para Docker

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario de PostgreSQL | `postgrest` |
| `POSTGRES_PASSWORD` | Password de PostgreSQL | `postgrest` |
| `POSTGRES_DB` | Nombre de la base de datos | `prueba_tecnica` |

### Backend (`backend/.env`)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexion a PostgreSQL | `postgresql://postgrest:postgrest@db:5432/prueba_tecnica?schema=public` |
| `PORT` | Puerto del servidor | `8000` |
| `JWT_ACCESS_SECRET` | Secreto para firmar access tokens | (string seguro) |
| `JWT_REFRESH_SECRET` | Secreto para firmar refresh tokens | (string seguro) |
| `JWT_SECRET` | Secreto general JWT | (string seguro) |
| `JWT_ACCESS_TTL` | Tiempo de vida del access token | `900s` |
| `JWT_REFRESH_TTL` | Tiempo de vida del refresh token | `7d` |
| `FRONTEND_URL` | Origen de la aplicacion frontend | `http://localhost:3000` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3000` |

### Frontend (`client/.env`)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | URL base de la API del backend | `http://localhost:8000` |

---

## Migraciones y Seed

Desde la carpeta `backend/`:

```bash
# Aplicar migraciones
npx prisma migrate deploy

# Ejecutar seed con datos de prueba
npx prisma db seed
```

Con Docker:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

El seed crea 5 usuarios, 2 perfiles de doctor, 2 perfiles de paciente y 8 prescripciones de ejemplo con diversos estados e items.

---

## Cuentas de Prueba

| Rol | Email | Password | Nombre |
|-----|-------|----------|--------|
| Admin | `admin@test.com` | `admin123` | Administrador |
| Medico | `dr@test.com` | `dr123` | Dr. Carlos Lopez |
| Medico | `dr2@test.com` | `dr123` | Dra. Maria Garcia |
| Paciente | `patient@test.com` | `patient123` | Juan Perez |
| Paciente | `patient2@test.com` | `patient123` | Ana Martinez |

---

## Scripts Disponibles

### Backend (`cd backend`)

| Comando | Descripcion |
|---------|-------------|
| `npm run start:dev` | Inicia el servidor en modo desarrollo con hot reload |
| `npm run build` | Compila el proyecto |
| `npm test` | Ejecuta los tests unitarios |


### Frontend (`cd client`)

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo Next.js |
| `npm run build` | Genera el build de produccion |
| `npm run start` | Sirve el build de produccion |
| `npm test` | Ejecuta los tests con Jest |

---

## Testing

### Backend

```bash
cd backend
npm test
```

Tests unitarios incluidos:
- **AuthService** (`auth.service.spec.ts`): login exitoso, email inexistente, password incorrecto.
- **PrescriptionsService** (`prescriptions.service.spec.ts`): creacion de prescripcion, consumir prescripcion, validacion de pertenencia al paciente, prescripcion inexistente.

Para generar el reporte detallado de cobertura de pruebas, ejecuta:
`npm run test:cov`

El reporte visual estará disponible en: `backend/coverage/lcov-report/index.html`

Se priorizó el testing unitario del AuthService para garantizar la seguridad del flujo de autenticación (100% coverage) y se cubrieron las funcionalidades críticas del PrescriptionsService, cumpliendo con los requerimientos mínimos de testing de la prueba

### Frontend

```bash
cd client
npm test
```

Tests incluidos:
- **API Client** (`api.test.ts`): verificacion de headers de autorizacion con token del store.

---

### Documentacion

Para detalles sobre arquitectura, desiciones tecnicas y estrategias usadas, ver el archivo [Documentacion](./docs/Documentacion.md)

