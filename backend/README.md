# Fisiocita Backend

API REST para gestión de clínicas de fisioterapia construida con NestJS, PostgreSQL y Prisma.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- pnpm (recomendado) o npm

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd fisiocita/backend
```

2. **Copiar variables de entorno**
```bash
cp .env.example .env
```

3. **Levantar servicios con Docker**
```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en puerto 5432
- Redis en puerto 6379
- MinIO (S3) en puerto 9000

4. **Instalar dependencias**
```bash
pnpm install
```

5. **Generar Prisma Client**
```bash
pnpm prisma:generate
```

6. **Ejecutar migraciones**
```bash
pnpm prisma:migrate
```

7. **Seed de datos de ejemplo**
```bash
pnpm prisma:seed
```

8. **Iniciar servidor de desarrollo**
```bash
pnpm start:dev
```

El servidor estará disponible en: http://localhost:3000/api/v1

### Acceso a Swagger

Documentación interactiva de la API:
```
http://localhost:3000/api/v1/docs
```

## 📋 Credenciales de Prueba

Después del seed, puedes usar estas credenciales:

**Admin**
- Email: `admin@clinicafisio.com`
- Password: `Admin123!`

**Fisioterapeuta**
- Email: `maria.garcia@clinicafisio.com`
- Password: `Fisio123!`

**Paciente**
- Email: `carlos.rodriguez@email.com`
- Password: `Patient123!`

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev          # Iniciar con hot reload
pnpm start:debug        # Iniciar con debugger

# Producción
pnpm build              # Compilar para producción
pnpm start:prod         # Ejecutar compilado

# Testing
pnpm test               # Tests unitarios
pnpm test:watch         # Tests en modo watch
pnpm test:cov           # Tests con coverage
pnpm test:e2e           # Tests de integración

# Prisma
pnpm prisma:generate    # Generar Prisma Client
pnpm prisma:migrate     # Ejecutar migraciones
pnpm prisma:studio      # Abrir Prisma Studio (GUI)
pnpm prisma:seed        # Ejecutar seed

# Linting
pnpm lint               # Ejecutar ESLint
pnpm format             # Formatear con Prettier
```

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   ├── seed.ts               # Seed de datos
│   └── migrations/           # Migraciones
├── src/
│   ├── common/               # Código compartido
│   │   ├── decorators/       # Decorators personalizados
│   │   ├── guards/           # Guards (RBAC, Clinic)
│   │   ├── prisma/           # Servicio de Prisma
│   │   └── logger/           # Configuración de logs
│   ├── modules/              # Módulos de la aplicación
│   │   ├── auth/             # Autenticación (JWT)
│   │   ├── clinics/          # Gestión de clínicas
│   │   ├── users/            # Gestión de usuarios
│   │   ├── physiotherapists/ # Gestión de fisioterapeutas
│   │   ├── patients/         # Gestión de pacientes
│   │   ├── appointments/     # Gestión de citas
│   │   ├── activities/       # Gestión de actividades
│   │   └── calendar/         # Calendarios
│   ├── app.module.ts         # Módulo principal
│   └── main.ts               # Punto de entrada
├── logs/                     # Logs de la aplicación
├── docker-compose.yml        # Servicios Docker
├── Dockerfile                # Imagen Docker
└── package.json
```

## 🔐 Autenticación

La API usa JWT con refresh tokens:

1. **Login**: `POST /api/v1/auth/login`
   - Retorna `accessToken` (15 min) y `refreshToken` (7 días)

2. **Proteger requests**: Incluir header
   ```
   Authorization: Bearer {accessToken}
   ```

3. **Renovar token**: `POST /api/v1/auth/refresh`
   - Enviar `refreshToken` en body
   - Retorna nuevo `accessToken` y `refreshToken`

4. **Logout**: `POST /api/v1/auth/logout`
   - Invalida el `refreshToken` en BD

## 🔒 Roles y Permisos

### ADMIN
- Acceso completo a la plataforma
- Gestión de clínicas, usuarios, configuración

### PHYSIOTHERAPIST
- Ver y gestionar su calendario
- Confirmar/cancelar citas
- Gestionar actividades grupales
- Ver historial de pacientes

### PATIENT
- Ver calendarios disponibles
- Reservar citas y actividades
- Ver su historial

## 🗄️ Base de Datos

### Prisma Studio

Para explorar la base de datos visualmente:

```bash
pnpm prisma:studio
```

Abre en: http://localhost:5555

### Migraciones

```bash
# Crear nueva migración
pnpm prisma migrate dev --name descripcion_cambio

# Aplicar migraciones en producción
pnpm prisma migrate deploy

# Reset completo (CUIDADO: borra todos los datos)
pnpm prisma migrate reset
```

## 🔧 Configuración

Todas las configuraciones se gestionan mediante variables de entorno en `.env`:

### Variables Esenciales

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET="tu-secreto-muy-seguro"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="otro-secreto-muy-seguro"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# API
PORT=3000
NODE_ENV="development"
```

Ver `.env.example` para todas las variables disponibles.

## 🐳 Docker

### Development

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Limpiar volúmenes (CUIDADO: borra datos)
docker-compose down -v
```

### Production

```bash
# Construir imagen
docker build -t fisiocita-api .

# Ejecutar contenedor
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name fisiocita-api \
  fisiocita-api
```

## 📊 Monitoreo

### Logs

Los logs se guardan en:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 12345,
  "environment": "development"
}
```

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests con coverage
pnpm test:cov

# Tests e2e
pnpm test:e2e

# Tests en modo watch
pnpm test:watch
```

## 🚀 Deployment

### Variables de Entorno para Producción

Asegúrate de configurar:
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` y `JWT_REFRESH_SECRET` seguros
- ✅ `DATABASE_URL` con conexión segura (SSL)
- ✅ `REDIS_PASSWORD` configurado
- ✅ `CORS_ORIGINS` con dominios permitidos

### Build

```bash
pnpm build
```

Los archivos compilados estarán en `dist/`

### Ejecutar en Producción

```bash
pnpm start:prod
```

## 📚 Documentación Adicional

- [Arquitectura](../docs/architecture.md)
- [Esquema de BD](../docs/database-schema.md)
- [API Endpoints](../docs/api.md)

## 🤝 Contribución

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'Add: nueva funcionalidad'`
3. Push: `git push origin feature/nueva-funcionalidad`
4. Abrir Pull Request

## 📝 Notas

### Multi-tenancy

Todas las queries deben incluir `clinicId` para garantizar aislamiento de datos. Los guards y RLS se encargan de esto automáticamente.

### Rate Limiting

Por defecto: 10 requests/min por IP. Configurable en `app.module.ts`.

### Prisma Client

Regenerar después de cambios en `schema.prisma`:

```bash
pnpm prisma:generate
```

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL

```bash
# Verificar que Docker esté corriendo
docker-compose ps

# Reiniciar servicios
docker-compose restart postgres
```

### Error de migración

```bash
# Reset de BD (desarrollo)
pnpm prisma migrate reset

# Aplicar migraciones
pnpm prisma migrate dev
```

### Puerto 3000 ocupado

Cambiar `PORT` en `.env` o detener el proceso:

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 📞 Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.
