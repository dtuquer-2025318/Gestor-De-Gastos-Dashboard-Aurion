# 💰 Gestión de Gastos — AURION

Proyecto full-stack profesional para el control y visualización de gastos personales y empresariales. Desarrollado con estándares de la industria: arquitectura limpia, autenticación segura con JWT, validación estricta de datos y un diseño moderno responsive bajo el sistema de diseño **AURION**.

El sistema permite a los usuarios registrarse, iniciar sesión de forma segura, visualizar un dashboard con estadísticas y gráficos interactivos, y cuenta con protección automática de sesión por inactividad.

---

## 0. Estructura de software y de carpetas

```
gestion-de-gastos/
├── backend/                          # API REST (Node + TypeScript + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma             # Modelo de datos (User, Role enum)
│   │   └── seed.ts                   # Datos iniciales de prueba
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                # Validación estricta de variables de entorno
│   │   │   ├── prisma.ts             # Cliente Prisma singleton
│   │   │   └── security.ts           # Configuración de Helmet y Rate Limiting
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # Verificación JWT + tipado de request
│   │   │   └── error.middleware.ts   # Manejo centralizado de errores (AppError, Zod, Prisma, JWT)
│   │   ├── modules/
│   │   │   └── auth/
│   │   │       ├── dto/
│   │   │       │   ├── login.dto.ts      # Esquema Zod de login
│   │   │       │   ├── register.dto.ts   # Esquema Zod de registro (complejidad de contraseña)
│   │   │       │   └── index.ts          # Barrel export
│   │   │       ├── auth.controller.ts    # Endpoints /login y /register
│   │   │       ├── auth.routes.ts        # Router Express
│   │   │       ├── auth.service.ts       # Lógica de negocio + generación JWT
│   │   │       └── auth.types.ts         # Tipos específicos del módulo
│   │   ├── utils/
│   │   │   └── catch-async.ts        # Helper para capturar errores async en controllers
│   │   └── index.ts                  # Punto de entrada: CORS, rutas, health check, 404, errores
│   ├── .env.example                  # Plantilla de variables de entorno
│   ├── .gitignore
│   ├── package.json                  # Dependencias + scripts (pnpm)
│   └── tsconfig.json                 # TypeScript strict mode
│
└── frontend/                         # SPA (Angular standalone, zoneless)
    ├── src/
    │   ├── app/
    │   │   ├── core/                         # Lógica global (singleton, infraestructura)
    │   │   │   ├── guards/
    │   │   │   │   └── auth.guard.ts         # Protege rutas verificando token vigente
    │   │   │   ├── interceptors/
    │   │   │   │   └── auth.interceptor.ts   # Adjunta JWT + maneja 401 → logout
    │   │   │   ├── models/
    │   │   │   │   └── auth.model.ts         # Interfaces: User, AuthResponse, DTOs
    │   │   │   └── services/
    │   │   │       ├── auth.service.ts       # Login, register, logout, Signals
    │   │   │       └── session.service.ts    # Monitoreo de expiración JWT + inactividad por visibilidad
    │   │   ├── features/                     # Módulos funcionales (pantallas)
    │   │   │   ├── auth/
    │   │   │   │   ├── login/
    │   │   │   │   │   ├── login.component.ts
    │   │   │   │   │   ├── login.component.html
    │   │   │   │   │   └── login.component.css
    │   │   │   │   └── register/
    │   │   │   │       ├── register.component.ts
    │   │   │   │       ├── register.component.html
    │   │   │   │       └── register.component.css
    │   │   │   └── dashboard/
    │   │   │       ├── dashboard.component.ts    # Sidebar, gráficos SVG, stats, perfil dinámico
    │   │   │       ├── dashboard.component.html
    │   │   │       └── dashboard.component.css
    │   │   ├── app.component.ts              # Root component (solo router-outlet)
    │   │   ├── app.component.html
    │   │   ├── app.config.ts                 # Zoneless + Router + HttpClient + Interceptor
    │   │   └── app.routes.ts                 # Lazy loading: /login, /register, /dashboard
    │   ├── environments/
    │   │   ├── environment.ts            # Variables de desarrollo (URL API, timeout inactividad)
    │   │   └── environment.prod.ts       # Variables de producción
    │   ├── public/
    │   │   └── favicon.svg
    │   ├── index.html
    │   ├── main.ts
    │   ├── main.server.ts
    │   └── styles.css                    # Sistema de diseño AURION v2.0 completo
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    └── .gitignore
```

### Patrón arquitectónico

- **Backend:** Arquitectura por módulos autocontenidos. Cada módulo (`auth`, y futuros módulos de gastos) tiene su propio `dto/`, `controller`, `service`, `routes` y `types`. Esto permite escalar horizontalmente sin tocar código existente. Separa claramente la capa de presentación (`controller`), la lógica de negocio (`service`) y la validación de datos (`dto`/Zod).
- **Frontend:** Arquitectura por features. `core/` contiene servicios singleton de infraestructura (auth, sesión, interceptores, guards). `features/` contiene dominios de negocio aislados (auth, dashboard, gastos futuro). Nunca se importa de `features/` dentro de `core/`.

---

## 1. Stack tecnológico y versiones

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 22.23.1 | Runtime de JavaScript |
| Express | ^4.21.0 | Framework web REST API |
| TypeScript | ^5.6.2 | Tipado estático estricto |
| Prisma ORM | ^5.20.0 | ORM para PostgreSQL con tipado automático |
| PostgreSQL | 14+ | Base de datos relacional |
| Zod | ^3.23.8 | Validación de esquemas en runtime |
| JWT (jsonwebtoken) | ^9.0.2 | Autenticación con tokens firmados |
| BCryptJS | ^2.4.3 | Hashing seguro de contraseñas |
| Helmet | ^7.x | Headers de seguridad HTTP (XSS, clickjacking, MIME sniffing) |
| Express Rate Limit | ^7.x | Protección contra ataques de fuerza bruta |
| CORS | ^2.8.5 | Control de acceso entre dominios (frontend ↔ backend) |
| dotenv | ^16.4.5 | Carga de variables de entorno desde `.env` |

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | ^22.0.0 | Framework SPA con signals y change detection zoneless |
| TypeScript | 6.0.2 | Tipado estático |
| RxJS | ~7.8.0 | Programación reactiva para peticiones HTTP |
| Bootstrap | ^5.3.8 | Grid system y utilidades CSS |
| Bootstrap Icons | ^1.13.1 | Iconografía vectorial |
| jwt-decode | ^4.0.0 | Decodificación de JWT en el cliente (monitoreo de expiración) |

### Entorno de desarrollo

| Herramienta | Versión | Uso |
|---|---|---|
| pnpm | 11.15.1 | Gestor de paquetes (único autorizado en el proyecto) |
| Angular CLI | 22.0.8 | Generación de componentes, builds y servidor de desarrollo |
| Nodemon | ^3.1.7 | Hot-reload del backend en desarrollo |
| ts-node | ^10.9.2 | Ejecución directa de TypeScript sin compilar |

---

## 2. Funcionalidades implementadas

### 🔐 Autenticación y seguridad

- **Registro de usuarios:** Validación de email único, contraseña con complejidad mínima (8 caracteres, mayúscula, minúscula, número, símbolo), y rechazo de contraseñas comunes conocidas (`123456`, `password`, `qwerty`, etc.).
- **Login seguro:** Mensajes de error genéricos ("Credenciales incorrectas") para evitar enumeración de usuarios. Hashing de contraseñas con BCrypt a 12 salt rounds.
- **JWT firmados:** Tokens con expiración configurable, firmados con secreto criptográfico de 256+ bits validado al arranque del servidor.
- **Rate Limiting:** Máximo 5 intentos de login fallidos por IP cada 15 minutos.
- **Headers de seguridad:** Helmet protege contra XSS, clickjacking y sniffing de MIME.
- **CORS restringido:** Solo se permite el origen configurado en `FRONTEND_URL`.

### 📊 Dashboard profesional

- **Sidebar navegable:** Menú lateral con iconos y estados activos.
- **Tarjetas de estadísticas:** Visualización de saldo total, gastos totales y ahorros totales.
- **Gráfico de barras SVG:** Comparativa mensual con doble serie (barras azules y moradas), renderizado nativo sin librerías externas.
- **Perfil dinámico:** El header muestra el nombre real del usuario autenticado y su rol (`Admin` o `Usuario`) leídos del Signal de autenticación.

### 🕐 Gestión de sesión inteligente

- **Expiración por JWT:** El frontend monitorea el tiempo de expiración del token y cierra sesión automáticamente cuando vence.
- **Cierre por inactividad (Page Visibility API):** Si el usuario cambia de pestaña o minimiza el navegador, inicia un conteo configurable (por defecto 2 minutos). Si regresa antes, el conteo se cancela. Si no regresa, la sesión se cierra automáticamente.
- **Mensajes diferenciados:** El login distingue entre "sesión expirada por JWT", "sesión cerrada por inactividad" y "credenciales inválidas".

### ✅ Validaciones y buenas prácticas

- **Zod en backend:** Todos los inputs de la API se validan antes de tocar la base de datos.
- **Validación doble:** El frontend también valida en tiempo real para feedback inmediato al usuario.
- **Manejo centralizado de errores:** Un único middleware captura errores de Zod, Prisma, JWT y errores internos, respondiendo siempre con mensajes controlados (sin exponer stack traces en producción).

---

## 3. Requisitos previos

Instala en tu computadora:

1. **Node.js** 22.23.1 (o superior): https://nodejs.org
2. **PostgreSQL** 14+ (o superior): https://www.postgresql.org/download/
3. **pnpm** 11.15.1 (gestor de paquetes):
   ```bash
   npm install -g pnpm
   ```
4. Un editor de código (VS Code recomendado) y Git.

Verifica las instalaciones:

```bash
node -v      # v22.23.1
pnpm -v      # 11.15.1
psql --version
```

---

## 4. Backend paso a paso

### 4.1 Crear la base de datos en PostgreSQL

Abre una terminal con `psql` (o usa pgAdmin) y ejecuta:

```sql
CREATE DATABASE aurion_db;
```

### 4.2 Instalar dependencias

```bash
cd backend
pnpm install
```

### 4.3 Instalar dependencias de seguridad

```bash
pnpm add express-rate-limit helmet
pnpm add -D @types/express-rate-limit
```

### 4.4 Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales. **Nunca subas este archivo a GitHub.**

```env
# Puerto del servidor backend
PORT=3000

# Conexión a PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/aurion_db?schema=public"

# Clave secreta para firmar JWT (mínimo 64 caracteres hex generados criptográficamente)
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=""

# Tiempo de expiración del token (ej: 15m, 1h, 24h)
JWT_EXPIRES_IN="1h"

# Entorno: development | production | test
NODE_ENV="development"

# URL del frontend para CORS
FRONTEND_URL="http://localhost:4200"
```

### 4.5 Generar Prisma Client y ejecutar migraciones

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```

### 4.6 (Opcional) Insertar datos de ejemplo

```bash
pnpm ts-node prisma/seed.ts
```

### 4.7 Levantar el servidor en desarrollo

```bash
pnpm dev
```

Deberías ver:

```
🚀 Servidor backend escuchando en: http://localhost:3000
🩺 Health check disponible en: http://localhost:3000/api/v1/health
🌐 CORS habilitado para: http://localhost:4200
📝 Entorno: development
```

### 4.8 Probar la API

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Registro
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","email":"juan@aurion.com","password":"Aurion2026!"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@aurion.com","password":"Aurion2026!"}'
```

> **Tip:** `pnpm prisma studio` abre una interfaz web para ver y editar las tablas visualmente.

---

## 5. Frontend paso a paso

### 5.1 Instalar Angular CLI globalmente (si no lo tienes)

```bash
pnpm add -g @angular/cli@22.1.4
```

### 5.2 Instalar dependencias

```bash
cd frontend
pnpm install
```

> **Nota:** Si `zone.js` aparece en las dependencias, elimínalo porque el proyecto usa `provideZonelessChangeDetection()`:
> ```bash
> pnpm remove zone.js
> ```

### 5.3 Configurar variables de entorno

Edita `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  /** Tiempo en minutos para cerrar sesión por inactividad (pestaña oculta) */
  inactivityTimeoutMinutes: 2,
};
```

Para producción, edita `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api/v1',
  inactivityTimeoutMinutes: 5,
};
```

### 5.4 Levantar el frontend en desarrollo

```bash
pnpm start
```

Se abrirá (o ve manualmente a) `http://localhost:4200`.

### 5.5 Flujo de prueba recomendado

1. Ve a **Registro** (`/register`) y crea una cuenta con una contraseña segura.
2. Inicia sesión en **Login** (`/login`).
3. Explora el **Dashboard**: observa el sidebar, las tarjetas de estadísticas y el gráfico de barras.
4. Verifica que el header muestra tu nombre real y tu rol.
5. Cambia de pestaña del navegador y espera 2 minutos: la sesión debería cerrarse automáticamente por inactividad.
6. Vuelve a la pestaña: deberías ver el mensaje "Tu sesión se cerró por inactividad" en el login.

---

## 6. Variables de entorno

### Backend (`.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | Sí | Puerto donde escucha el servidor Express |
| `DATABASE_URL` | Sí | URL de conexión a PostgreSQL |
| `JWT_SECRET` | Sí | Clave secreta para firmar tokens (mínimo 32 chars, recomendado 64+) |
| `JWT_EXPIRES_IN` | Sí | Tiempo de vida del token (ej: `1h`, `15m`) |
| `NODE_ENV` | No | Entorno de ejecución (`development`, `production`, `test`) |
| `FRONTEND_URL` | No | Origen permitido por CORS (default: `http://localhost:4200`) |

### Frontend (`environment.ts`)

| Variable | Descripción |
|---|---|
| `apiUrl` | URL base de la API backend |
| `inactivityTimeoutMinutes` | Minutos de tolerancia antes de cerrar sesión por cambio de pestaña |

---

## 7. Scripts disponibles

### Backend (`backend/package.json`)

| Script | Comando | Descripción |
|---|---|---|
| Desarrollo | `pnpm dev` | Nodemon + ts-node con hot-reload |
| Build | `pnpm build` | Compila TypeScript a `dist/` |
| Producción | `pnpm start` | Ejecuta el build compilado |
| Prisma Generate | `pnpm prisma:generate` | Genera el cliente Prisma tipado |
| Prisma Migrate | `pnpm prisma:migrate` | Crea y aplica migraciones de base de datos |
| Prisma Studio | `pnpm prisma:studio` | UI visual para explorar la base de datos |
| Seed | `pnpm seed` | Ejecuta el script de datos iniciales |

### Frontend (`frontend/package.json`)

| Script | Comando | Descripción |
|---|---|---|
| Desarrollo | `pnpm start` | Servidor de desarrollo Angular en `localhost:4200` |
| Build | `pnpm build` | Build de producción optimizado |
| Build watch | `pnpm watch` | Build en modo observación |
| Tests | `pnpm test` | Ejecuta la suite de pruebas unitarias |

---

## 8. Cómo funciona cada tema clave en este proyecto

| Concepto | Dónde se aplica en el proyecto |
|---|---|
| Arquitectura limpia (Clean Architecture) | Backend organizado en módulos autocontenidos (`modules/auth/`) con separación controller/service/dto |
| Validación de esquemas | Zod en `register.dto.ts` y `login.dto.ts` valida inputs antes de tocar la base de datos |
| Hashing seguro | BCrypt con 12 salt rounds en `auth.service.ts` |
| JWT | Firmado con `jsonwebtoken` en el backend; decodificado con `jwt-decode` en el frontend para monitoreo |
| Rate Limiting | `express-rate-limit` protege los endpoints de autenticación contra fuerza bruta |
| Headers de seguridad | `helmet` añade protecciones HTTP automáticas |
| Reactive Forms | Login y registro usan `FormBuilder` + validadores síncronos y asíncronos |
| Signals | `AuthService.currentUser` es un Signal reactivo que actualiza la UI automáticamente |
| Zoneless Change Detection | `provideZonelessChangeDetection()` en `app.config.ts` elimina zone.js para mejor rendimiento |
| Lazy Loading | Rutas cargadas por demanda en `app.routes.ts` |
| Interceptors | `authInterceptor` adjunta el JWT a cada petición HTTP y maneja 401 |
| Guards | `authGuard` protege rutas como `/dashboard` verificando validez del token |
| Page Visibility API | `document.visibilitychange` detecta cuando el usuario abandona la pestaña para iniciar conteo de inactividad |
| Sistema de diseño | Variables CSS personalizadas en `styles.css` (colores, espaciado, sombras, animaciones AURION) |

---

## 9. Notas adicionales

### Convenciones seguidas

- **pnpm exclusivo:** Todo comando usa `pnpm`. No se usa `npm` ni `yarn` en ninguna parte del proyecto.
- **TypeScript strict mode:** Activado en ambos proyectos (backend y frontend).
- **Nomenclatura:** Archivos en `kebab-case` (ej: `auth.service.ts`), clases en `PascalCase` (ej: `AuthService`), interfaces en `PascalCase` con sufijo opcional (ej: `LoginDTO`).
- **Barrel exports:** Cada carpeta `dto/` tiene un `index.ts` para importaciones limpias.
- **Sin `any`:** Evitado en todo el proyecto; se usan tipos explícitos y `unknown` cuando es necesario.

### Escalabilidad futura

La arquitectura está preparada para añadir nuevos módulos sin refactorización:

1. **Nuevo módulo backend:** Crear carpeta en `src/modules/nuevo-modulo/` con su `dto/`, `controller`, `service`, `routes` y `types`.
2. **Nueva feature frontend:** Crear carpeta en `src/app/features/nueva-feature/` con componentes standalone.
3. **Nuevo modelo Prisma:** Añadir al `schema.prisma` y ejecutar `pnpm prisma:migrate`.
4. **Registro de rutas:** Importar las rutas del nuevo módulo en `src/index.ts` (backend) o `app.routes.ts` (frontend).

---

## 10. Comandos rápidos (resumen)

```bash
# Instalar pnpm (una sola vez)
npm install -g pnpm

# ========== BACKEND ==========
cd backend
pnpm install
pnpm add express-rate-limit helmet
pnpm add -D @types/express-rate-limit
cp .env.example .env
# Editar .env con DATABASE_URL y JWT_SECRET generado
# Generar JWT_SECRET:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm dev            # http://localhost:3000

# ========== FRONTEND ==========
cd ../frontend
pnpm install
# Eliminar zone.js si aún está:
# pnpm remove zone.js
# Editar src/environments/environment.ts con la URL del backend
pnpm start           # http://localhost:4200
```

---

## 📁 ¿Dónde va este README?

**Ubicación recomendada:** Raíz del repositorio (`/README.md`).

**Justificación:** El README debe estar en la raíz porque es el primer archivo que GitHub (o cualquier cliente de Git) muestra al abrir el repositorio. Además, describe **ambas partes** del proyecto (backend + frontend) como un sistema único, lo cual es la forma estándar de documentar proyectos full-stack. Si estuviera dentro de `backend/` o `frontend/`, solo describiría una mitad y el visitante no entendería la arquitectura completa.

Si deseas, puedes mantener una **copia resumida** en `backend/README.md` y `frontend/README.md` con solo los comandos específicos de cada carpeta, pero la documentación maestra debe vivir en la raíz.

---

*Desarrollado con estándares profesionales — © 2026 AURION.*