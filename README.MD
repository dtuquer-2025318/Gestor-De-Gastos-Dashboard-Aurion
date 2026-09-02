# AURION — Gestión de Gastos

Sistema full-stack para control fiscal y visualización de ingresos/gastos, diseñado bajo el sistema AURION v2.0. Soporta deducciones fiscales de Guatemala (IVA 12%, ISR 5%, IGSS 4.83%) y control de acceso por roles.

> **Nota rápida:** Este proyecto usa `pnpm` exclusivamente. No uses `npm` ni `yarn` porque el lockfile y los scripts están calibrados para pnpm.

---

## ¿Qué hace esto?

Es una aplicación de gestión financiera con dos perfiles de usuario:

- **Administrador:** Puede crear, editar y anular ingresos. Ve todos los KPIs en tiempo real.
- **Usuario estándar:** Solo lectura. Puede consultar datos pero no modificarlos.

El backend calcula automáticamente las deducciones fiscales según el tipo de ingreso (factura o planilla) y el frontend muestra todo en un dashboard con gráficos SVG nativos, sin librerías externas de charts.

---

## Arquitectura

```
## 0. Estructura de software y de carpetas

```
gestion-de-gastos/
├── backend/                          # API REST (Node + TypeScript + Express + Prisma)
│   ├── prisma/
│   │   ├── migrations/               # Historial de migraciones SQL (init, add_ingreso_model)
│   │   ├── schema.prisma             # Modelo de datos (User, Ingreso, Role, Categoria, Comprobante, Estado)
│   │   └── seed.ts                   # Datos iniciales de prueba (Admin y registros base)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                # Validación estricta de variables de entorno
│   │   │   ├── prisma.ts             # Cliente Prisma singleton
│   │   │   └── security.ts           # Configuración de Helmet y Rate Limiting
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # Verificación JWT + extracción de usuario
│   │   │   ├── role.middleware.ts    # Middleware requireAdmin para protección de mutaciones HTTP
│   │   │   └── error.middleware.ts   # Manejo centralizado de errores (AppError, Zod, Prisma, JWT)
│   │   ├── modules/
│   │   │   ├── auth/                 # Módulo de Autenticación (Login, Register, Perfil)
│   │   │   └── income/               # Módulo de Ingresos y Cálculos Fiscales
│   │   │       ├── dto/              # Esquemas Zod (crearIngresoDto, actualizarIngresoDto)
│   │   │       ├── income.controller.ts # Endpoints REST de Ingresos y KPIs
│   │   │       ├── income.routes.ts     # Definición de rutas protegidas por roles
│   │   │       └── income.service.ts    # Lógica de negocio, deducciones fiscales y agregación de KPIs
│   │   └── index.ts                  # Punto de entrada principal Express API
│   ├── .env                          # Variables de entorno locales
│   ├── package.json                  # Dependencias + scripts (pnpm)
│   └── tsconfig.json                 # TypeScript strict mode
│
└── frontend/                         # SPA (Angular standalone, zoneless)
    ├── src/
    │   ├── app/
    │   │   ├── core/                         # Lógica global (singleton, infraestructura)
    │   │   │   ├── guards/                   # Protecciones de rutas por JWT
    │   │   │   ├── interceptors/             # Adjunta Bearer token + captura de 401/403
    │   │   │   ├── models/                   # Interfaces TypeScript (auth.model.ts, income.model.ts)
    │   │   │   └── services/
    │   │   │       ├── auth.service.ts       # Autenticación, Signals de usuario y perfil
    │   │   │       ├── session.service.ts    # Control de inactividad y expiración
    │   │   │       └── income.service.ts     # Peticiones HTTP de Ingresos y cálculo de KPIs
    │   │   ├── features/                     # Módulos de pantalla
    │   │   │   ├── auth/
    │   │   │   │   ├── login/                # Componente de Login (Alertas estandarizadas en 3ª persona)
    │   │   │   │   └── register/             # Componente de Registro de Usuarios
    │   │   │   └── dashboard/
    │   │   │       ├── dashboard.component.ts# Layout principal, Topbar, Sidebar dinámico
    │   │   │       ├── inicio/               # Vista resumida y estadísticas iniciales
    │   │   │       └── income/               # Módulo CRUD de Ingresos (Modal, KPIs, Filtros, Soft Delete)
    │   │   ├── app.routes.ts                 # Rutas lazy loading con Guards
    │   │   └── app.config.ts                 # Configuración Zoneless + HttpClient
    │   ├── environments/                     # Variables de entorno (development / production)
    │   └── styles.css                        # Sistema de diseño AURION v2.0
    ├── angular.json
    └── package.json```

```

El backend sigue una estructura por módulos autocontenidos. Cada módulo tiene su propia capa de validación (Zod), lógica de negocio (service) y presentación (controller). El frontend usa Angular standalone con change detection zoneless (sin zone.js), signals para estado reactivo y RxJS solo para HTTP.

---

## Stack

### Backend
- **Node.js 22.23.1** + Express 4.21
- **TypeScript 5.6** (strict mode)
- **Prisma 5.20** + PostgreSQL 14+
- **Zod** para validación de inputs
- **JWT** (jsonwebtoken) + BCryptJS para auth
- **Helmet** + **express-rate-limit** para headers de seguridad y protección contra fuerza bruta

### Frontend
- **Angular 22** (standalone components, zoneless)
- **TypeScript 6.0.2**
- **RxJS 7.8** (solo para peticiones HTTP)
- **Bootstrap 5.3.8** + Bootstrap Icons
- **jwt-decode** para monitorear expiración de token en el cliente

### Dev
- **pnpm 11.15.1** (gestor de paquetes obligatorio)
- **Angular CLI 22.0.8**
- **Nodemon** + **ts-node** para desarrollo backend

---

## Antes de empezar

Necesitas esto instalado:

```bash
node -v      # v22.23.1 o superior
pnpm -v      # 11.15.1
psql --version  # PostgreSQL 14+
```

Si no tienes pnpm:
```bash
npm install -g pnpm
```

---

## Backend

### 1. Crear la base de datos

```bash
psql -U postgres
```

```sql
CREATE DATABASE aurion_db;
```

### 2. Instalar dependencias

```bash
cd backend
pnpm install
```

Instala las dependencias de seguridad (no vienen en el package.json base por si prefieres configurarlas manualmente):

```bash
pnpm add express-rate-limit helmet
pnpm add -D @types/express-rate-limit
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/aurion_db?schema=public"
JWT_SECRET=""  # Genera esto con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN="1h"
NODE_ENV="development"
FRONTEND_URL="http://localhost:4200"
```

> **Importante:** El JWT_SECRET debe tener mínimo 64 caracteres hex. No lo inventes a mano, usa el comando de arriba. Y nunca subas `.env` a Git.

### 4. Generar Prisma Client y migrar

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```

### 5. (Opcional) Cargar datos de prueba

```bash
pnpm ts-node prisma/seed.ts
```

Esto crea un usuario admin y algunos registros base para que no empieces con tablas vacías.

### 6. Levantar servidor

```bash
pnpm dev
```

Deberías ver algo como:

```
🚀 Servidor backend escuchando en: http://localhost:3000
🩺 Health check: http://localhost:3000/api/v1/health
🌐 CORS habilitado para: http://localhost:4200
📝 Entorno: development
```

### 7. Probar la API rápidamente

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Registro
curl -X POST http://localhost:3000/api/v1/auth/register   -H "Content-Type: application/json"   -d '{"name":"Juan Pérez","email":"juan@aurion.com","password":"Aurion2026!"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login   -H "Content-Type: application/json"   -d '{"email":"juan@aurion.com","password":"Aurion2026!"}'
```

Si quieres explorar la base de datos visualmente:
```bash
pnpm prisma studio
```

---

## Frontend

### 1. Instalar Angular CLI (si no lo tienes)

```bash
pnpm add -g @angular/cli@22.1.4
```

### 2. Instalar dependencias

```bash
cd frontend
pnpm install
```

> **Ojo:** Si `zone.js` aparece en las dependencias, elimínalo. Este proyecto usa `provideZonelessChangeDetection()` y zone.js solo te dará problemas:
> ```bash
> pnpm remove zone.js
> ```

### 3. Configurar entorno

Edita `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  inactivityTimeoutMinutes: 2,
};
```

Para producción, edita `environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api/v1',
  inactivityTimeoutMinutes: 5,
};
```

### 4. Levantar en desarrollo

```bash
pnpm start
```

Abre `http://localhost:4200`.

---

## Flujo de prueba recomendado

1. Ve a `/register` y crea una cuenta. La contraseña necesita mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.
2. Inicia sesión en `/login`.
3. Explora el dashboard: fíjate en el sidebar, las tarjetas de KPIs y el gráfico de barras SVG.
4. El header debe mostrar tu nombre real y tu rol (Admin o Usuario).
5. Cambia de pestaña del navegador y espera 2 minutos. La sesión se cierra automáticamente por inactividad (usa la Page Visibility API + JWT expiration).
6. Vuelve a la pestaña: deberías ver el mensaje de cierre por inactividad en el login.

---

## Cálculos fiscales implementados

### Facturas (Servicios, Productos, Consultoría, Otros)

- **Base Imponible** = Monto Bruto / 1.12
- **IVA (12%)** = Monto Bruto - Base Imponible
- **ISR (5%)** = Base Imponible * 0.05
- **Previsión Impuestos** = IVA + ISR

### Planilla (Salarios)

- **IGSS (4.83%)** = Monto Bruto * 0.0483
- **Previsión Impuestos** = Q 0.00

### Anulación lógica (Soft Delete)

Cuando un admin anula un ingreso, el registro sigue visible en la lista con estilo tachado y badge "ANULADO", pero sus valores se descuentan automáticamente de los KPIs globales. Esto mantiene el historial contable intacto.

---

## Scripts disponibles

### Backend

| Script | Comando | Qué hace |
|---|---|---|
| Dev | `pnpm dev` | Nodemon + ts-node con hot-reload |
| Build | `pnpm build` | Compila TypeScript a `dist/` |
| Start | `pnpm start` | Ejecuta el build compilado |
| Prisma Generate | `pnpm prisma:generate` | Genera cliente Prisma tipado |
| Prisma Migrate | `pnpm prisma:migrate` | Crea y aplica migraciones |
| Prisma Studio | `pnpm prisma:studio` | UI visual de la base de datos |
| Seed | `pnpm seed` | Ejecuta datos de prueba |

### Frontend

| Script | Comando | Qué hace |
|---|---|---|
| Dev | `pnpm start` | Servidor Angular en `localhost:4200` |
| Build | `pnpm build` | Build de producción optimizado |
| Watch | `pnpm watch` | Build en modo observación |
| Test | `pnpm test` | Suite de pruebas unitarias |

---

## Seguridad y buenas prácticas

- **Validación doble:** Zod valida en el backend antes de tocar la base de datos. El frontend también valida en tiempo real para dar feedback inmediato.
- **Hashing:** BCrypt con 12 salt rounds. Mensajes de error genéricos en login para evitar enumeración de usuarios.
- **Rate Limiting:** Máximo 5 intentos de login fallidos por IP cada 15 minutos.
- **Helmet:** Headers de seguridad HTTP activados por defecto (XSS, clickjacking, MIME sniffing).
- **RBAC:** Middleware `requireAdmin` bloquea mutaciones HTTP (POST, PUT, DELETE) a usuarios estándar, devolviendo 403.
- **Errores centralizados:** Un solo middleware captura errores de Zod, Prisma, JWT e internos. En producción nunca se expone el stack trace.
- **Sesión inteligente:** El frontend monitorea la expiración del JWT con `jwt-decode` y usa la Page Visibility API para detectar inactividad al cambiar de pestaña.

---

## Convenciones del proyecto

- **pnpm exclusivo.** No uses npm ni yarn.
- **TypeScript strict mode** en backend y frontend.
- **Archivos:** `kebab-case` (ej: `auth.service.ts`). **Clases:** `PascalCase` (ej: `AuthService`).
- **Barrel exports:** Cada carpeta `dto/` tiene un `index.ts` para importaciones limpias.
- **Sin `any`:** Usa tipos explícitos o `unknown` cuando sea necesario.
- **Alertas:** Los mensajes de alerta se redactan en tercera persona y sin botón de cierre desalineado ("Su sesión se cerró por inactividad...", "Verifique sus credenciales...").

---

## Escalabilidad

La arquitectura está pensada para agregar módulos sin tocar lo existente:

1. **Nuevo módulo backend:** Crea carpeta en `src/modules/nuevo-modulo/` con su `dto/`, `controller.ts`, `service.ts`, `routes.ts`.
2. **Nueva feature frontend:** Crea carpeta en `src/app/features/nueva-feature/` con componentes standalone.
3. **Nuevo modelo Prisma:** Añade a `schema.prisma` y corre `pnpm prisma:migrate`.
4. **Registro de rutas:** Importa en `src/index.ts` (backend) o `app.routes.ts` (frontend).

---

## Troubleshooting

**Error: `Cannot find module '@prisma/client'`**
> Corré `pnpm prisma generate`. El cliente tipado no se genera automáticamente al clonar.

**Error de CORS en el frontend**
> Verifica que `FRONTEND_URL` en el `.env` del backend coincida exactamente con la URL donde corre Angular (incluyendo el puerto).

**La sesión se cierra inmediatamente al loguearme**
> Revisa que el reloj de tu sistema esté sincronizado. JWT es sensible a diferencias de tiempo. También verifica que `JWT_EXPIRES_IN` no esté en un valor ridículamente bajo como `5s`.

**El gráfico SVG no renderiza**
> Asegúrate de que haya al menos un ingreso activo en la base de datos. El gráfico se alimenta de los datos reales, no de mock data.

**Zone.js errors en consola**
> Ejecuta `pnpm remove zone.js` y reinicia el servidor de desarrollo. Este proyecto no usa zone.js.

---

## Variables de entorno (referencia rápida)

### Backend `.env`

| Variable | Requerida | Descripción |
|---|---|---|
| `PORT` | Sí | Puerto del servidor Express |
| `DATABASE_URL` | Sí | URL de conexión PostgreSQL |
| `JWT_SECRET` | Sí | Clave para firmar tokens (mínimo 32 chars, recomendado 64+) |
| `JWT_EXPIRES_IN` | Sí | Vida del token (ej: `1h`, `15m`) |
| `NODE_ENV` | No | `development`, `production` o `test` |
| `FRONTEND_URL` | No | Origen permitido por CORS (default: `http://localhost:4200`) |

### Frontend `environment.ts`

| Variable | Descripción |
|---|---|
| `apiUrl` | URL base de la API backend |
| `inactivityTimeoutMinutes` | Minutos de tolerancia antes de cerrar sesión por cambio de pestaña |

---

*Desarrollado con estándares profesionales — AURION 2026*