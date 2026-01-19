# Fisiocita - SaaS para Clínicas de Fisioterapia

## Contexto del Proyecto
Aplicación SaaS multi-tenant para gestión de clínicas de fisioterapia con:
- Gestión de citas individuales
- Gestión de actividades grupales (pilates, etc.)
- Sistema de roles: Admin, Fisioterapeutas, Pacientes
- Calendarios integrados con bloqueo automático

## Stack Tecnológico
- **Backend**: TypeScript + NestJS + PostgreSQL + Prisma
- **Frontend**: React Native + Expo (iOS, Android, Web)
- **Infraestructura**: Docker + Redis + BullMQ
- **Auth**: JWT + Refresh Tokens + RBAC
- **API**: REST con OpenAPI/Swagger

## Arquitectura Multi-tenant
- Single DB con `clinic_id` en todas las tablas
- Row Level Security (RLS) en PostgreSQL
- Guards en NestJS para aislamiento de datos

## Reglas de Desarrollo
1. Siempre incluir `clinic_id` en queries y mutaciones
2. Validar permisos por rol antes de operaciones
3. Logs estructurados para auditoría
4. Documentar endpoints en Swagger
5. Tests unitarios y de integración
