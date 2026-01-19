# 🏥 Fisiocita - SaaS para Clínicas de Fisioterapia

Sistema integral para la gestión de clínicas de fisioterapia con soporte multi-tenant, gestión de citas, actividades grupales y facturación.

## 🚀 Características Principales

- **Gestión de Citas**: Sistema de reservas para consultas individuales con fisioterapeutas
- **Actividades Grupales**: Gestión de clases de pilates y otras actividades con límite de participantes
- **Calendarios Inteligentes**: Bloqueo automático cuando un fisioterapeuta está en actividad grupal
- **Multi-tenant**: Soporte para múltiples clínicas en una única instancia
- **Roles de Usuario**: Admin, Fisioterapeutas y Pacientes con permisos específicos
- **Aplicación Móvil**: Apps nativas para iOS y Android usando React Native + Expo

## 📋 Requisitos Previos

- **Node.js**: v18 o superior
- **Docker**: v20 o superior
- **Docker Compose**: v2 o superior
- **pnpm**: v8 o superior (recomendado) o npm

## 🏗️ Estructura del Proyecto

```
fisiocita/
├── backend/              # API NestJS + PostgreSQL + Prisma
│   ├── src/
│   ├── prisma/
│   ├── docker-compose.yml
│   └── Dockerfile
├── mobile-app/           # App React Native + Expo
│   ├── src/
│   ├── app.json
│   └── package.json
├── docs/                 # Documentación
│   ├── architecture.md
│   ├── database-schema.md
│   └── api.md
└── README.md
```

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: NestJS (TypeScript)
- **Base de Datos**: PostgreSQL 15 con RLS (Row Level Security)
- **ORM**: Prisma
- **Autenticación**: JWT + Refresh Tokens
- **Jobs**: BullMQ + Redis
- **Documentación API**: Swagger/OpenAPI
- **Containerización**: Docker + Docker Compose

### Frontend
- **Framework**: React Native con Expo
- **Gestión de Estado**: Context API / Zustand
- **Navegación**: React Navigation
- **UI**: React Native Paper / Native Base
- **HTTP Client**: Axios

## 🚀 Inicio Rápido

### Backend

```bash
# Navegar al directorio backend
cd backend

# Copiar variables de entorno
cp .env.example .env

# Levantar servicios con Docker
docker-compose up -d

# Instalar dependencias
pnpm install

# Ejecutar migraciones
pnpm prisma migrate dev

# Seed inicial (opcional)
pnpm prisma db seed

# Iniciar servidor de desarrollo
pnpm start:dev
```

El backend estará disponible en: `http://localhost:3000`
Swagger UI: `http://localhost:3000/api/docs`

### Mobile App

```bash
# Navegar al directorio mobile-app
cd mobile-app

# Instalar dependencias
pnpm install

# Iniciar Expo
pnpm start

# Ejecutar en iOS
pnpm ios

# Ejecutar en Android
pnpm android

# Ejecutar en Web
pnpm web
```

## 🔐 Roles y Permisos

### Admin
- Gestión completa de la clínica
- Crear/editar/eliminar fisioterapeutas y pacientes
- Configuración de actividades
- Acceso a reportes y facturación

### Fisioterapeuta
- Ver y gestionar su calendario personal
- Confirmar/cancelar citas
- Gestionar asistencia a actividades grupales
- Ver historial de pacientes

### Paciente
- Ver calendarios disponibles
- Reservar citas con fisioterapeutas
- Inscribirse en actividades grupales
- Ver su historial de citas

## 🗄️ Modelo de Datos

### Entidades Principales

- **Clinic**: Clínica (tenant)
- **User**: Usuarios del sistema
- **Physiotherapist**: Fisioterapeutas
- **Patient**: Pacientes
- **Appointment**: Citas individuales
- **Activity**: Actividades grupales (pilates, etc.)
- **ActivityBooking**: Reservas para actividades
- **Calendar**: Calendarios de disponibilidad

Ver [documentación completa del esquema](docs/database-schema.md)

## 🔄 Multi-tenancy

El sistema implementa multi-tenancy usando:

1. **Single Database**: Una base de datos compartida
2. **clinic_id**: Columna discriminadora en todas las tablas
3. **Row Level Security (RLS)**: Políticas a nivel de PostgreSQL
4. **Guards en NestJS**: Validación de acceso por tenant
5. **JWT Claims**: Token incluye `clinicId` del usuario

## 📡 API

La API REST está documentada con Swagger y sigue principios RESTful.

### Endpoints Principales

```
POST   /auth/login                    # Autenticación
POST   /auth/refresh                  # Renovar token
GET    /clinics                       # Listar clínicas (admin)
POST   /clinics                       # Crear clínica (admin)
GET    /appointments                  # Listar citas
POST   /appointments                  # Crear cita
GET    /activities                    # Listar actividades
POST   /activities                    # Crear actividad
POST   /activities/:id/book           # Reservar plaza en actividad
GET    /physiotherapists/:id/calendar # Calendario de fisioterapeuta
```

Ver [documentación completa de la API](docs/api.md)

## 🔧 Variables de Entorno

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fisiocita"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# API
PORT=3000
NODE_ENV="development"

# S3 Compatible Storage (opcional)
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
```

## 🧪 Testing

```bash
# Backend
cd backend
pnpm test              # Tests unitarios
pnpm test:e2e          # Tests de integración
pnpm test:cov          # Coverage

# Mobile App
cd mobile-app
pnpm test
```

## 📦 Deployment

### Backend (Docker)

```bash
cd backend
docker build -t fisiocita-api .
docker run -p 3000:3000 fisiocita-api
```

### Mobile App

```bash
# Build para producción
cd mobile-app
eas build --platform all

# Publicar actualización OTA
eas update --branch production
```

## 🛣️ Roadmap

- [x] Sistema de autenticación y roles
- [x] Gestión de citas individuales
- [x] Gestión de actividades grupales
- [x] Calendarios con bloqueo automático
- [ ] Sistema de facturación
- [ ] Notificaciones push
- [ ] Recordatorios automáticos por email/SMS
- [ ] Consentimientos informados digitales
- [ ] Reportes y analíticas
- [ ] Integración con pasarelas de pago
- [ ] Videoconsultas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

## 📞 Soporte

Para soporte y consultas, contactar a: [tu-email@dominio.com]

---

Hecho con ❤️ para mejorar la gestión de clínicas de fisioterapia
