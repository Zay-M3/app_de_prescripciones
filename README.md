# MedPrescribe

Sistema de prescripciones medicas con soporte para tres roles: **Medico**, **Paciente** y **Admin**. El medico crea prescripciones asociadas a un paciente con items digitados manualmente. El paciente visualiza sus prescripciones, puede marcarlas como consumidas y descargarlas en PDF. El admin consulta metricas generales del sistema.

---

## Demo / Despliegue

| Servicio | URL |
|----------|-----|
| Frontend | `https://prescripciones-frontend-hazel.vercel.app/login` |
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

### Frontend

```bash
cd client
npm test
```

Tests incluidos:
- **API Client** (`api.test.ts`): verificacion de headers de autorizacion con token del store.

---

## Documentacion de API (Swagger)

La documentacion interactiva de la API esta disponible en:

```
http://localhost:8000/api
```

Incluye todos los endpoints documentados con:
- Autenticacion Bearer (boton "Authorize" para probar con token)
- Descripcion de DTOs con propiedades y validaciones
- Agrupacion por tags: Auth, Users, Prescriptions, Admin

Para obtener un token y probar endpoints protegidos:
1. Ejecutar `POST /auth/login` con las credenciales de prueba.
2. Copiar el `accessToken` de la respuesta.
3. Hacer clic en "Authorize" e ingresar el token.

---

## Decisiones Tecnicas

### Autenticacion y JWT

Se implementa un esquema de doble token con rotacion y revocacion:
- **Access token** (15 minutos): se envia en el header `Authorization: Bearer <token>` en cada peticion.
- **Refresh token** (7 dias): se utiliza para obtener un nuevo access token cuando este expira. El refresh token se hashea con bcrypt y se almacena en la base de datos (`hashedRt` en el modelo User). En cada refresh se emite un par de tokens nuevo y se actualiza el hash (rotacion). El endpoint `POST /auth/logout` invalida el refresh token eliminando el hash de la BD (revocacion).

En el frontend, el cliente API (`lib/api.ts`) detecta respuestas 401 y automaticamente intenta refrescar el token antes de reintentar la peticion. Si el refresh tambien falla, se limpia la sesion y se redirige al login. Se implementa un mecanismo de cola para evitar multiples refreshes simultaneos.

Los tokens se almacenan en Zustand con persistencia en localStorage. Se eligio este enfoque sobre cookies HTTP-Only por simplicidad en el contexto de una SPA con Next.js App Router en modo client-side.

### RBAC (Control de Acceso por Roles)

**Backend:** Se utilizan Guards personalizados con un decorador `@Roles()` que verifica el rol del usuario autenticado contra los roles permitidos en cada endpoint. Los roles son: `admin`, `doctor` y `patient`.

**Frontend:** El layout del dashboard (`layout.tsx`) verifica la autenticacion y el rol del usuario en cada cambio de ruta. Cada seccion de la aplicacion (`/admin`, `/doctor`, `/patient`) esta restringida a su rol correspondiente. Si un usuario intenta acceder a una ruta no permitida, es redirigido a su pagina de inicio segun su rol.

### Validacion del JWT contra la Base de Datos

El backend no confia en los datos del JWT de forma ciega. Aunque el token se firma y verifica criptograficamente, los claims del payload (rol, email) podrian estar desactualizados si el usuario fue modificado o eliminado despues de emitir el token.

Para mitigar esto, la estrategia JWT (`jwt.strategy.ts`) consulta la base de datos en cada peticion autenticada:

1. Passport decodifica y verifica la firma del token.
2. `JwtStrategy.validate()` toma el `sub` (ID del usuario) del payload y ejecuta `prisma.user.findUnique()` contra la BD.
3. Si el usuario ya no existe, se lanza `UnauthorizedException` y la peticion es rechazada.
4. Si el usuario existe, se retorna `{ sub, email, name, role }` con los datos frescos de la BD, no los del token.

Esto significa que el `role` que evalua `RolesGuard` siempre proviene de la base de datos. Si un admin cambia el rol de un usuario, el cambio surte efecto en la siguiente peticion sin necesidad de que el usuario vuelva a iniciar sesion. Del mismo modo, un usuario eliminado queda inmediatamente bloqueado aunque su token aun no haya expirado.

El mismo patron se aplica durante el refresh de tokens: `AuthService.refresh()` verifica el refresh token, consulta la BD para confirmar que el usuario sigue existiendo y construye los nuevos tokens con datos actualizados de la BD.

### Generacion de PDF

Se utiliza **pdfkit** para generar los PDFs de prescripciones directamente en el backend. Cada PDF incluye:
- Datos del paciente y del medico
- Fecha de creacion y codigo unico
- Lista de items con nombre, dosis, cantidad e instrucciones
- Estado de la prescripcion
- Codigo QR generado con la libreria **qrcode**, que apunta a la URL de la prescripcion en el frontend

El endpoint `GET /prescriptions/:id/pdf` esta disponible para admin, doctor y paciente autenticados.

### Paginacion y Filtros

Todos los endpoints de listado soportan:
- **Paginacion**: parametros `page` y `limit` con respuesta que incluye metadata (`total`, `page`, `limit`, `totalPages`).
- **Filtros**: por `status` (pending/consumed), rango de fechas (`from`, `to`), y filtros especificos por endpoint.
- **Ordenamiento**: `order` parametrizable (ASC/DESC), por defecto `createdAt DESC`.

En el frontend, los filtros se persisten en los query params de la URL, lo que permite compartir enlaces con filtros aplicados y mantener el estado al navegar.

### Estado Global (Frontend)

Se utiliza **Zustand** para el estado de autenticacion (tokens, datos del usuario, funciones de login/logout). El store se persiste en localStorage para mantener la sesion entre recargas de pagina.

Se implementa un hook `useHydration` para controlar la hidratacion del store y evitar mismatches entre el renderizado del servidor y del cliente, mostrando un estado de carga hasta que el store esta listo.

### Temas Dark/Light

Se utiliza **next-themes** con soporte para deteccion del tema del sistema operativo. La preferencia del usuario se persiste automaticamente. El toggle esta disponible tanto en la pagina de login como en el navbar del dashboard.

### Seguridad

- **Helmet**: headers de seguridad HTTP.
- **CORS**: configurado con origen explicito del frontend.
- **Rate Limiting**: con `@nestjs/throttler` para prevenir abuso.
- **Validacion**: `ValidationPipe` global con `whitelist: true` que rechaza propiedades no declaradas en los DTOs.
- **Hashing**: passwords almacenados con bcrypt (salt rounds: 10).
- **Filtro de excepciones**: respuestas de error consistentes con estructura `{ message, code, details? }`.

---

## Modelo de Datos

```
User (id, email, password, name, role, createdAt, hashedRt)
 |
 ├── 1:1 ── Doctor (id, specialty, userId)
 |            └── 1:N ── Prescription (author)
 |
 └── 1:1 ── Patient (id, birthDate, userId)
              └── 1:N ── Prescription (patient)

Prescription (id, code, status, notes, createdAt, consumedAt, patientId, authorId)
 └── 1:N ── PrescriptionItem (id, name, dosage, quantity, instructions)
```

**Indices:**
- `Prescription(status, createdAt)` - optimiza consultas filtradas por estado con ordenamiento.
- `Prescription(patientId)` - optimiza consultas de prescripciones por paciente.
- `Prescription(authorId)` - optimiza consultas de prescripciones por medico.

**Estados de prescripcion:** `pending` (pendiente) y `consumed` (consumida).

---
