# Esquema de Base de Datos - Fisiocita

## Diagrama ER (Conceptual)

```
┌─────────────┐
│   Clinic    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────┴──────────┬──────────────┬──────────────┐
│                 │              │              │
▼                 ▼              ▼              ▼
User       Physiotherapist   Patient     Appointment
│                 │              │              │
│                 │              │              │
│                 ▼              │              │
│            Activity            │              │
│                 │              │              │
│                 ▼              ▼              │
│         ActivitySchedule  ActivityBooking    │
│                                               │
│                                               │
└───────────────────────────────────────────────┘
```

## Tablas Principales

### Clinic (Tenant)
Representa una clínica de fisioterapia.

| Campo     | Tipo      | Descripción                    |
|-----------|-----------|--------------------------------|
| id        | UUID      | PK                             |
| name      | String    | Nombre de la clínica           |
| email     | String    | Email (único)                  |
| phone     | String?   | Teléfono                       |
| address   | String?   | Dirección                      |
| city      | String?   | Ciudad                         |
| country   | String?   | País                           |
| timezone  | String    | Zona horaria (default: Europe/Madrid) |
| isActive  | Boolean   | Estado activo                  |
| createdAt | DateTime  | Fecha de creación              |
| updatedAt | DateTime  | Fecha de actualización         |

**Relaciones**:
- 1:N con User
- 1:N con Physiotherapist
- 1:N con Patient
- 1:N con Appointment
- 1:N con Activity

---

### User
Usuarios del sistema (admins, fisios, pacientes).

| Campo        | Tipo      | Descripción                      |
|--------------|-----------|----------------------------------|
| id           | UUID      | PK                               |
| clinicId     | UUID      | FK → Clinic                      |
| email        | String    | Email (único por clínica)        |
| password     | String    | Contraseña hasheada (bcrypt)     |
| firstName    | String    | Nombre                           |
| lastName     | String    | Apellido                         |
| phone        | String?   | Teléfono                         |
| avatar       | String?   | URL de avatar                    |
| role         | Enum      | ADMIN, PHYSIOTHERAPIST, PATIENT  |
| isActive     | Boolean   | Estado activo                    |
| lastLogin    | DateTime? | Último login                     |
| refreshToken | String?   | Refresh token hasheado           |
| createdAt    | DateTime  | Fecha de creación                |
| updatedAt    | DateTime  | Fecha de actualización           |

**Índices**:
- `(clinicId, email)` - Único
- `(clinicId, role)` - Para queries por rol

**Relaciones**:
- N:1 con Clinic
- 1:1 con Physiotherapist (opcional)
- 1:1 con Patient (opcional)

---

### Physiotherapist
Perfil extendido para fisioterapeutas.

| Campo             | Tipo     | Descripción                     |
|-------------------|----------|---------------------------------|
| id                | UUID     | PK                              |
| clinicId          | UUID     | FK → Clinic                     |
| userId            | UUID     | FK → User (único)               |
| licenseNumber     | String?  | Número de colegiado             |
| specialization    | String?  | Especialización                 |
| bio               | String?  | Biografía                       |
| yearsOfExperience | Int?     | Años de experiencia             |
| isActive          | Boolean  | Estado activo                   |
| createdAt         | DateTime | Fecha de creación               |
| updatedAt         | DateTime | Fecha de actualización          |

**Relaciones**:
- N:1 con Clinic
- 1:1 con User
- 1:N con Appointment
- 1:N con Activity
- 1:N con Availability

---

### Patient
Perfil extendido para pacientes.

| Campo            | Tipo      | Descripción                     |
|------------------|-----------|---------------------------------|
| id               | UUID      | PK                              |
| clinicId         | UUID      | FK → Clinic                     |
| userId           | UUID      | FK → User (único)               |
| dateOfBirth      | DateTime? | Fecha de nacimiento             |
| gender           | String?   | Género                          |
| address          | String?   | Dirección                       |
| emergencyContact | String?   | Contacto de emergencia          |
| medicalHistory   | String?   | Historial médico                |
| notes            | String?   | Notas adicionales               |
| isActive         | Boolean   | Estado activo                   |
| createdAt        | DateTime  | Fecha de creación               |
| updatedAt        | DateTime  | Fecha de actualización          |

**Relaciones**:
- N:1 con Clinic
- 1:1 con User
- 1:N con Appointment
- 1:N con ActivityBooking

---

### Appointment
Citas individuales entre paciente y fisioterapeuta.

| Campo              | Tipo     | Descripción                          |
|--------------------|----------|--------------------------------------|
| id                 | UUID     | PK                                   |
| clinicId           | UUID     | FK → Clinic                          |
| patientId          | UUID     | FK → Patient                         |
| physiotherapistId  | UUID     | FK → Physiotherapist                 |
| startTime          | DateTime | Inicio de la cita                    |
| endTime            | DateTime | Fin de la cita                       |
| status             | Enum     | PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW |
| reason             | String?  | Motivo de la consulta                |
| notes              | String?  | Notas generales                      |
| diagnosisNotes     | String?  | Notas de diagnóstico                 |
| treatmentNotes     | String?  | Notas de tratamiento                 |
| cancelledAt        | DateTime?| Fecha de cancelación                 |
| cancelledBy        | String?  | Usuario que canceló                  |
| cancellationReason | String?  | Motivo de cancelación                |
| createdAt          | DateTime | Fecha de creación                    |
| updatedAt          | DateTime | Fecha de actualización               |

**Índices**:
- `(clinicId, physiotherapistId, startTime)` - Para buscar disponibilidad
- `(clinicId, patientId)` - Para historial del paciente
- `(clinicId, status)` - Para estadísticas

**Relaciones**:
- N:1 con Clinic
- N:1 con Patient
- N:1 con Physiotherapist

---

### Activity
Actividades grupales (pilates, yoga, etc.).

| Campo             | Tipo     | Descripción                     |
|-------------------|----------|---------------------------------|
| id                | UUID     | PK                              |
| clinicId          | UUID     | FK → Clinic                     |
| physiotherapistId | UUID     | FK → Physiotherapist            |
| name              | String   | Nombre de la actividad          |
| description       | String?  | Descripción                     |
| type              | Enum     | PILATES, YOGA, REHABILITATION, FUNCTIONAL_TRAINING, OTHER |
| difficulty        | Enum     | BEGINNER, INTERMEDIATE, ADVANCED|
| maxParticipants   | Int      | Número máximo de participantes  |
| durationMinutes   | Int      | Duración en minutos             |
| price             | Decimal? | Precio por sesión               |
| imageUrl          | String?  | URL de imagen                   |
| isActive          | Boolean  | Estado activo                   |
| createdAt         | DateTime | Fecha de creación               |
| updatedAt         | DateTime | Fecha de actualización          |

**Índices**:
- `(clinicId, isActive)` - Para listar activas
- `(clinicId, type)` - Para filtrar por tipo

**Relaciones**:
- N:1 con Clinic
- N:1 con Physiotherapist
- 1:N con ActivitySchedule
- 1:N con ActivityBooking

---

### ActivitySchedule
Horarios recurrentes de actividades.

| Campo     | Tipo      | Descripción                          |
|-----------|-----------|--------------------------------------|
| id        | UUID      | PK                                   |
| clinicId  | UUID      | FK → Clinic                          |
| activityId| UUID      | FK → Activity                        |
| dayOfWeek | Enum      | MONDAY, TUESDAY, ..., SUNDAY         |
| startTime | String    | Hora de inicio (formato "HH:MM")     |
| endTime   | String    | Hora de fin (formato "HH:MM")        |
| startDate | DateTime? | Inicio de validez (opcional)         |
| endDate   | DateTime? | Fin de validez (opcional)            |
| isActive  | Boolean   | Estado activo                        |
| createdAt | DateTime  | Fecha de creación                    |
| updatedAt | DateTime  | Fecha de actualización               |

**Índices**:
- `(clinicId, activityId)` - Para obtener horarios de actividad

**Relaciones**:
- N:1 con Clinic
- N:1 con Activity

---

### ActivityBooking
Reservas de pacientes en actividades grupales.

| Campo              | Tipo     | Descripción                     |
|--------------------|----------|---------------------------------|
| id                 | UUID     | PK                              |
| clinicId           | UUID     | FK → Clinic                     |
| activityId         | UUID     | FK → Activity                   |
| patientId          | UUID     | FK → Patient                    |
| sessionDate        | DateTime | Fecha de la sesión              |
| status             | Enum     | PENDING, CONFIRMED, CANCELLED, ATTENDED, NO_SHOW |
| notes              | String?  | Notas                           |
| cancelledAt        | DateTime?| Fecha de cancelación            |
| cancelledBy        | String?  | Usuario que canceló             |
| cancellationReason | String?  | Motivo de cancelación           |
| createdAt          | DateTime | Fecha de creación               |
| updatedAt          | DateTime | Fecha de actualización          |

**Índices**:
- `(activityId, patientId, sessionDate)` - Único (un paciente no puede reservar dos veces)
- `(clinicId, activityId, sessionDate)` - Para listar reservas
- `(clinicId, patientId)` - Para historial del paciente

**Relaciones**:
- N:1 con Activity
- N:1 con Patient

---

### Availability
Disponibilidad semanal de fisioterapeutas.

| Campo             | Tipo     | Descripción                     |
|-------------------|----------|---------------------------------|
| id                | UUID     | PK                              |
| clinicId          | UUID     | FK → Clinic                     |
| physiotherapistId | UUID     | FK → Physiotherapist            |
| dayOfWeek         | Enum     | MONDAY, TUESDAY, ..., SUNDAY    |
| startTime         | String   | Hora de inicio (formato "HH:MM")|
| endTime           | String   | Hora de fin (formato "HH:MM")   |
| isAvailable       | Boolean  | Disponible o no                 |
| createdAt         | DateTime | Fecha de creación               |
| updatedAt         | DateTime | Fecha de actualización          |

**Índices**:
- `(clinicId, physiotherapistId)` - Para obtener disponibilidad

**Relaciones**:
- N:1 con Clinic
- N:1 con Physiotherapist

---

### AuditLog
Registro de auditoría para trazabilidad.

| Campo     | Tipo      | Descripción                     |
|-----------|-----------|---------------------------------|
| id        | UUID      | PK                              |
| clinicId  | UUID?     | FK → Clinic (opcional)          |
| userId    | UUID?     | FK → User (opcional)            |
| action    | String    | CREATE, UPDATE, DELETE, LOGIN, etc. |
| entity    | String    | appointment, activity, user, etc.|
| entityId  | String?   | ID de la entidad afectada       |
| changes   | JSON?     | Cambios realizados              |
| ipAddress | String?   | Dirección IP                    |
| userAgent | String?   | User agent                      |
| createdAt | DateTime  | Fecha de creación               |

**Índices**:
- `(clinicId, entity, createdAt)` - Para auditorías por entidad
- `(userId, createdAt)` - Para auditorías por usuario

---

## Políticas de Row Level Security (RLS)

### Ejemplo: Política para tabla `users`

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política de lectura
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (clinic_id = current_setting('app.current_clinic_id')::uuid);

-- Política de inserción
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (clinic_id = current_setting('app.current_clinic_id')::uuid);

-- Política de actualización
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (clinic_id = current_setting('app.current_clinic_id')::uuid);

-- Política de eliminación
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING (clinic_id = current_setting('app.current_clinic_id')::uuid);
```

## Migraciones

Las migraciones se gestionan con Prisma:

```bash
# Crear migración
pnpm prisma migrate dev --name init

# Aplicar migraciones
pnpm prisma migrate deploy

# Reset (desarrollo)
pnpm prisma migrate reset
```

## Seed de Datos

El archivo `prisma/seed.ts` incluye datos de ejemplo:
- 1 clínica
- 1 admin
- 2 fisioterapeutas
- 2 pacientes
- Disponibilidades
- 2 actividades grupales (Pilates, Yoga)

```bash
pnpm prisma db seed
```
