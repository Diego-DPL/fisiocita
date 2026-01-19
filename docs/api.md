# Documentación de API - Fisiocita

## Base URL

```
Desarrollo: http://localhost:3000/api/v1
Producción: https://api.fisiocita.com/api/v1
```

## Swagger/OpenAPI

La documentación interactiva está disponible en:
```
http://localhost:3000/api/v1/docs
```

## Autenticación

Todos los endpoints (excepto login) requieren autenticación mediante JWT Bearer Token:

```
Authorization: Bearer {accessToken}
```

---

## Endpoints de Autenticación

### POST /auth/login
Iniciar sesión.

**Request Body**:
```json
{
  "email": "admin@clinicafisio.com",
  "password": "Admin123!"
}
```

**Response (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@clinicafisio.com",
    "firstName": "Admin",
    "lastName": "Sistema",
    "role": "ADMIN",
    "clinicId": "clinic-uuid",
    "clinic": {
      "id": "clinic-uuid",
      "name": "Clínica Fisioterapia Demo"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/refresh
Renovar access token.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200)**:
```json
{
  "accessToken": "nuevo-token",
  "refreshToken": "nuevo-refresh-token"
}
```

---

### POST /auth/logout
Cerrar sesión (invalida refresh token).

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "message": "Logout exitoso"
}
```

---

### GET /auth/me
Obtener información del usuario actual.

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "PATIENT",
  "clinicId": "clinic-uuid"
}
```

---

## Endpoints de Clínicas

### GET /clinics
Listar todas las clínicas (solo ADMIN).

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
[
  {
    "id": "clinic-uuid",
    "name": "Clínica Fisioterapia Demo",
    "email": "info@clinicafisio.com",
    "phone": "+34 912 345 678",
    "city": "Madrid",
    "country": "España",
    "isActive": true
  }
]
```

---

### GET /clinics/:id
Obtener detalles de una clínica.

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "id": "clinic-uuid",
  "name": "Clínica Fisioterapia Demo",
  "email": "info@clinicafisio.com",
  "phone": "+34 912 345 678",
  "address": "Calle Principal 123",
  "city": "Madrid",
  "country": "España",
  "timezone": "Europe/Madrid",
  "isActive": true,
  "users": [
    {
      "id": "user-uuid",
      "email": "admin@clinicafisio.com",
      "firstName": "Admin",
      "lastName": "Sistema",
      "role": "ADMIN"
    }
  ],
  "_count": {
    "users": 5,
    "physiotherapists": 2,
    "patients": 2,
    "appointments": 10,
    "activities": 2
  }
}
```

---

## Endpoints de Usuarios

### GET /users/profile
Obtener perfil del usuario actual.

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "id": "user-uuid",
  "email": "carlos.rodriguez@email.com",
  "firstName": "Carlos",
  "lastName": "Rodríguez",
  "phone": "+34 600 111 001",
  "role": "PATIENT",
  "clinicId": "clinic-uuid",
  "clinic": {
    "id": "clinic-uuid",
    "name": "Clínica Fisioterapia Demo"
  },
  "patient": {
    "id": "patient-uuid",
    "dateOfBirth": "1985-03-15T00:00:00.000Z",
    "gender": "M"
  }
}
```

---

## Endpoints de Fisioterapeutas

### GET /physiotherapists
Listar fisioterapeutas activos de la clínica.

**Headers**: `Authorization: Bearer {token}`

**Query Params**:
- `page` (opcional): Número de página
- `limit` (opcional): Elementos por página

**Response (200)**:
```json
{
  "data": [
    {
      "id": "physio-uuid",
      "licenseNumber": "FIS-001-2024",
      "specialization": "Traumatología deportiva",
      "bio": "Especialista en rehabilitación...",
      "yearsOfExperience": 10,
      "user": {
        "id": "user-uuid",
        "firstName": "María",
        "lastName": "García",
        "email": "maria.garcia@clinicafisio.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

---

### GET /physiotherapists/:id
Obtener detalles de un fisioterapeuta.

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "id": "physio-uuid",
  "licenseNumber": "FIS-001-2024",
  "specialization": "Traumatología deportiva",
  "bio": "Especialista en rehabilitación...",
  "yearsOfExperience": 10,
  "user": {
    "id": "user-uuid",
    "firstName": "María",
    "lastName": "García",
    "email": "maria.garcia@clinicafisio.com",
    "phone": "+34 600 000 002"
  },
  "availabilities": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "09:00",
      "endTime": "14:00"
    }
  ]
}
```

---

## Endpoints de Citas (Appointments)

### GET /appointments
Listar citas del usuario actual.

**Headers**: `Authorization: Bearer {token}`

**Query Params**:
- `status` (opcional): Filtrar por estado
- `from` (opcional): Fecha desde
- `to` (opcional): Fecha hasta

**Response (200)**:
```json
{
  "data": [
    {
      "id": "appointment-uuid",
      "startTime": "2024-01-20T10:00:00.000Z",
      "endTime": "2024-01-20T11:00:00.000Z",
      "status": "CONFIRMED",
      "reason": "Dolor de espalda",
      "patient": {
        "id": "patient-uuid",
        "user": {
          "firstName": "Carlos",
          "lastName": "Rodríguez"
        }
      },
      "physiotherapist": {
        "id": "physio-uuid",
        "user": {
          "firstName": "María",
          "lastName": "García"
        }
      }
    }
  ]
}
```

---

### POST /appointments
Crear una nueva cita.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "physiotherapistId": "physio-uuid",
  "startTime": "2024-01-20T10:00:00.000Z",
  "endTime": "2024-01-20T11:00:00.000Z",
  "reason": "Dolor de espalda"
}
```

**Response (201)**:
```json
{
  "id": "appointment-uuid",
  "clinicId": "clinic-uuid",
  "patientId": "patient-uuid",
  "physiotherapistId": "physio-uuid",
  "startTime": "2024-01-20T10:00:00.000Z",
  "endTime": "2024-01-20T11:00:00.000Z",
  "status": "PENDING",
  "reason": "Dolor de espalda"
}
```

---

### PATCH /appointments/:id/confirm
Confirmar una cita (solo PHYSIOTHERAPIST, ADMIN).

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "id": "appointment-uuid",
  "status": "CONFIRMED"
}
```

---

### PATCH /appointments/:id/cancel
Cancelar una cita.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "reason": "No puedo asistir"
}
```

**Response (200)**:
```json
{
  "id": "appointment-uuid",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-15T12:00:00.000Z",
  "cancellationReason": "No puedo asistir"
}
```

---

## Endpoints de Actividades

### GET /activities
Listar actividades activas.

**Headers**: `Authorization: Bearer {token}`

**Query Params**:
- `type` (opcional): Filtrar por tipo
- `difficulty` (opcional): Filtrar por dificultad

**Response (200)**:
```json
{
  "data": [
    {
      "id": "activity-uuid",
      "name": "Pilates Terapéutico",
      "description": "Clase de pilates enfocada...",
      "type": "PILATES",
      "difficulty": "INTERMEDIATE",
      "maxParticipants": 8,
      "durationMinutes": 60,
      "price": 15.00,
      "physiotherapist": {
        "user": {
          "firstName": "Juan",
          "lastName": "López"
        }
      },
      "schedules": [
        {
          "dayOfWeek": "MONDAY",
          "startTime": "18:00",
          "endTime": "19:00"
        }
      ]
    }
  ]
}
```

---

### GET /activities/:id
Obtener detalles de una actividad.

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "id": "activity-uuid",
  "name": "Pilates Terapéutico",
  "description": "Clase de pilates enfocada...",
  "type": "PILATES",
  "difficulty": "INTERMEDIATE",
  "maxParticipants": 8,
  "durationMinutes": 60,
  "price": 15.00,
  "physiotherapist": {
    "id": "physio-uuid",
    "user": {
      "firstName": "Juan",
      "lastName": "López"
    }
  },
  "schedules": [
    {
      "id": "schedule-uuid",
      "dayOfWeek": "MONDAY",
      "startTime": "18:00",
      "endTime": "19:00"
    }
  ],
  "bookings": [
    {
      "id": "booking-uuid",
      "sessionDate": "2024-01-22T18:00:00.000Z",
      "status": "CONFIRMED",
      "patient": {
        "user": {
          "firstName": "Ana",
          "lastName": "Martínez"
        }
      }
    }
  ]
}
```

---

### POST /activities/:id/book
Reservar plaza en una actividad.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "sessionDate": "2024-01-22T18:00:00.000Z"
}
```

**Response (201)**:
```json
{
  "id": "booking-uuid",
  "activityId": "activity-uuid",
  "patientId": "patient-uuid",
  "sessionDate": "2024-01-22T18:00:00.000Z",
  "status": "CONFIRMED"
}
```

**Errores**:
- `400`: Actividad llena
- `409`: Ya reservado para esa fecha

---

### DELETE /activities/:activityId/bookings/:bookingId
Cancelar reserva de actividad.

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "message": "Reserva cancelada exitosamente"
}
```

---

## Endpoints de Calendario

### GET /calendar/physiotherapist/:id
Obtener calendario de un fisioterapeuta.

**Headers**: `Authorization: Bearer {token}`

**Query Params**:
- `from`: Fecha desde (ISO 8601)
- `to`: Fecha hasta (ISO 8601)

**Response (200)**:
```json
{
  "physiotherapist": {
    "id": "physio-uuid",
    "user": {
      "firstName": "María",
      "lastName": "García"
    }
  },
  "availability": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "09:00",
      "endTime": "14:00"
    }
  ],
  "appointments": [
    {
      "id": "appointment-uuid",
      "startTime": "2024-01-22T10:00:00.000Z",
      "endTime": "2024-01-22T11:00:00.000Z",
      "status": "CONFIRMED"
    }
  ],
  "activities": [
    {
      "id": "activity-uuid",
      "name": "Pilates Terapéutico",
      "sessionDate": "2024-01-22T18:00:00.000Z",
      "startTime": "18:00",
      "endTime": "19:00"
    }
  ],
  "freeSlots": [
    {
      "date": "2024-01-22",
      "slots": [
        {
          "start": "09:00",
          "end": "10:00"
        },
        {
          "start": "11:00",
          "end": "12:00"
        }
      ]
    }
  ]
}
```

---

## Códigos de Estado HTTP

- **200**: OK - Solicitud exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Datos inválidos
- **401**: Unauthorized - No autenticado
- **403**: Forbidden - No autorizado (falta permisos)
- **404**: Not Found - Recurso no encontrado
- **409**: Conflict - Conflicto (ej: reserva duplicada)
- **422**: Unprocessable Entity - Error de validación
- **429**: Too Many Requests - Rate limit excedido
- **500**: Internal Server Error - Error del servidor

---

## Rate Limiting

- **Límite**: 10 requests por minuto por IP
- **Header de respuesta**: `X-RateLimit-Remaining`

---

## Paginación

Endpoints que retornan listas soportan paginación:

**Query Params**:
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## Errores

Formato estándar de error:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email"
    }
  ]
}
```
