# Arquitectura de Fisiocita

## Visión General

Fisiocita es una aplicación SaaS multi-tenant para la gestión de clínicas de fisioterapia. La arquitectura está diseñada para soportar múltiples clínicas en una única instancia, garantizando el aislamiento de datos y la escalabilidad.

## Stack Tecnológico

### Backend
- **Framework**: NestJS (TypeScript)
- **Base de Datos**: PostgreSQL 15
- **ORM**: Prisma
- **Autenticación**: JWT + Refresh Tokens
- **Caché/Jobs**: Redis + BullMQ
- **Documentación**: Swagger/OpenAPI
- **Containerización**: Docker + Docker Compose

### Frontend
- **Framework**: React Native + Expo
- **Estado**: Zustand
- **Navegación**: React Navigation
- **UI**: React Native Paper
- **HTTP**: Axios

## Arquitectura Multi-Tenant

### Estrategia: Single Database + clinic_id

Utilizamos un enfoque de base de datos compartida con discriminador `clinic_id`:

#### Ventajas
- ✅ Menor costo operacional
- ✅ Más fácil de mantener
- ✅ Backups simplificados
- ✅ Migraciones centralizadas

#### Desventajas
- ⚠️ Riesgo de fuga de datos (mitigado con RLS)
- ⚠️ Escalabilidad limitada (solucionable con sharding)

### Row Level Security (RLS)

PostgreSQL RLS añade una capa adicional de seguridad:

```sql
-- Ejemplo de política RLS
CREATE POLICY clinic_isolation ON users
  USING (clinic_id = current_setting('app.current_clinic_id')::uuid);
```

### Guards de NestJS

Protección a nivel de aplicación:

1. **JwtAuthGuard**: Valida token JWT
2. **RolesGuard**: Valida roles (ADMIN, PHYSIOTHERAPIST, PATIENT)
3. **ClinicGuard**: Valida acceso a recursos de la clínica correcta

## Flujo de Autenticación

```
1. Usuario envía credenciales → POST /auth/login
2. Backend valida y genera tokens:
   - Access Token (15 min)
   - Refresh Token (7 días)
3. Frontend almacena tokens en SecureStore
4. Cada request incluye: Authorization: Bearer {accessToken}
5. Token expira → Frontend usa refreshToken → Obtiene nuevo accessToken
6. RefreshToken expira → Usuario debe volver a iniciar sesión
```

### Payload del JWT

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "PATIENT",
  "clinicId": "clinic_uuid"
}
```

## Módulos del Backend

### 1. Auth Module
- Login/Logout
- Refresh Token
- Guards y Strategies

### 2. Clinics Module
- CRUD de clínicas
- Solo accesible por ADMIN

### 3. Users Module
- Gestión de usuarios
- Perfil de usuario

### 4. Physiotherapists Module
- CRUD de fisioterapeutas
- Disponibilidad y calendarios

### 5. Patients Module
- CRUD de pacientes
- Historial médico

### 6. Appointments Module
- Reserva de citas individuales
- Confirmación/Cancelación
- Estados: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW

### 7. Activities Module
- Gestión de actividades grupales
- Horarios recurrentes
- Reservas con límite de participantes

### 8. Calendar Module
- Vista unificada de calendarios
- Disponibilidad de fisioterapeutas
- Bloqueo automático por actividades

## Gestión de Calendarios

### Bloqueo Automático

Cuando un fisioterapeuta está asignado a una actividad grupal:

1. Se verifica el horario de la actividad
2. Se bloquea el calendario individual del fisio
3. No se pueden reservar citas en ese horario
4. Se muestra "No disponible - Actividad grupal"

### Implementación

```typescript
// Pseudocódigo
async checkAvailability(physioId, startTime, endTime) {
  // 1. Verificar disponibilidad base
  const availability = await getPhysioAvailability(physioId);
  
  // 2. Verificar citas existentes
  const appointments = await getAppointments(physioId, startTime, endTime);
  
  // 3. Verificar actividades grupales
  const activities = await getActivities(physioId, startTime, endTime);
  
  // 4. Retornar slots disponibles
  return calculateFreeSlots(availability, appointments, activities);
}
```

## Jobs Asíncronos (BullMQ)

### Colas Configuradas

1. **emails-queue**: Envío de emails
2. **notifications-queue**: Notificaciones push
3. **reminders-queue**: Recordatorios de citas
4. **maintenance-queue**: Tareas de mantenimiento

### Ejemplo: Recordatorio de Citas

```typescript
@Processor('reminders-queue')
export class RemindersProcessor {
  @Process('appointment-reminder')
  async handleReminder(job: Job) {
    const { appointmentId } = job.data;
    // Enviar email/SMS 24h antes de la cita
  }
}
```

## Observabilidad

### Logs Estructurados

Usando Winston para logs:

```typescript
logger.info('User logged in', {
  userId: user.id,
  clinicId: user.clinicId,
  ip: request.ip,
});
```

### Audit Log

Todas las acciones importantes se registran:

```typescript
await prisma.auditLog.create({
  data: {
    clinicId,
    userId,
    action: 'CREATE',
    entity: 'appointment',
    entityId: appointment.id,
    changes: { ... },
  },
});
```

## Seguridad

### Medidas Implementadas

1. **Passwords**: Bcrypt con salt rounds = 10
2. **Tokens**: JWT firmados, refresh tokens hasheados en DB
3. **Rate Limiting**: Throttler (10 req/min por IP)
4. **CORS**: Orígenes permitidos configurables
5. **Helmet**: Headers de seguridad HTTP
6. **Validación**: class-validator en todos los DTOs
7. **RLS**: Políticas a nivel de PostgreSQL

### Variables Sensibles

Todas las credenciales en variables de entorno:
- JWT_SECRET
- JWT_REFRESH_SECRET
- DATABASE_URL
- REDIS_PASSWORD

## Escalabilidad

### Horizontal Scaling

- Backend: Múltiples instancias detrás de load balancer
- Redis: Redis Cluster para mayor throughput
- PostgreSQL: Read replicas para queries pesadas

### Vertical Scaling

- Aumentar recursos de contenedores
- Optimización de queries con índices
- Caché de queries frecuentes en Redis

## Deployment

### Desarrollo
```bash
docker-compose up -d
cd backend && pnpm start:dev
cd mobile-app && pnpm start
```

### Producción
```bash
# Backend
docker build -t fisiocita-api .
docker run -p 3000:3000 fisiocita-api

# Mobile
eas build --platform all
eas submit
```

## Monitoreo

### Métricas Recomendadas
- Response time de API
- Tasa de errores
- CPU/Memoria de contenedores
- Queries lentas de PostgreSQL
- Tamaño de colas de Redis

### Herramientas Sugeridas
- **APM**: New Relic / DataDog
- **Logs**: ELK Stack / Loki
- **Métricas**: Prometheus + Grafana
- **Uptime**: UptimeRobot / Pingdom

## Roadmap Técnico

### Fase 1 (Actual)
- ✅ Autenticación y roles
- ✅ Gestión de citas y actividades
- ✅ Calendarios básicos

### Fase 2
- [ ] Sistema de notificaciones
- [ ] Facturación integrada
- [ ] Reportes y analíticas

### Fase 3
- [ ] Videoconsultas
- [ ] Integración con pasarelas de pago
- [ ] App para fisioterapeutas (nativa)

### Fase 4
- [ ] GraphQL API
- [ ] Microservicios
- [ ] Sharding de base de datos
