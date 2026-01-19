# 🚀 Guía de Configuración para Colaboradores

Esta guía te ayudará a configurar el proyecto Fisiocita en tu máquina local después de clonarlo desde GitHub.

## ⚠️ Importante
Si no puedes hacer login, probablemente es porque falta configurar el entorno correctamente. Sigue todos los pasos en orden.

## 📋 Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** v18 o superior: https://nodejs.org/
- **Docker** v20 o superior: https://www.docker.com/
- **Docker Compose** v2 o superior
- **pnpm** (recomendado): `npm install -g pnpm`

## 🛠️ Configuración Paso a Paso

### 1. Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd fisiocita
```

### 2. Configurar el Backend

```bash
# Ir al directorio del backend
cd backend

# Copiar archivo de variables de entorno
cp .env.example .env
```

#### 2.1 Editar Variables de Entorno
Abre el archivo `.env` y ajusta estas variables si es necesario:

```dotenv
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fisiocita?schema=public"

# JWT Configuration - CAMBIA ESTOS VALORES EN PRODUCCIÓN
JWT_SECRET="tu-clave-secreta-super-segura-aqui-123456789"
JWT_REFRESH_SECRET="otra-clave-secreta-diferente-para-refresh-987654321"

# Los demás valores pueden quedarse como están para desarrollo local
```

#### 2.2 Levantar Servicios de Base de Datos
```bash
# Levantar PostgreSQL y Redis con Docker
docker-compose up -d

# Verificar que los contenedores estén corriendo
docker-compose ps
```

#### 2.3 Instalar Dependencias y Configurar Base de Datos
```bash
# Instalar dependencias de Node.js
pnpm install

# Generar cliente de Prisma
pnpm prisma generate

# Ejecutar migraciones para crear tablas
pnpm prisma migrate dev

# Poblar base de datos con datos de prueba
pnpm prisma db seed
```

#### 2.4 Iniciar el Servidor Backend
```bash
# Iniciar en modo desarrollo
pnpm start:dev
```

**✅ El backend debería estar corriendo en: http://localhost:3000**
**📚 Swagger API docs en: http://localhost:3000/api/docs**

### 3. Configurar la App Móvil

En una **nueva terminal**:

```bash
# Ir al directorio de la app móvil
cd mobile-app

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
pnpm install

# Iniciar Expo
pnpm start
```

### 4. Credenciales de Prueba

Después del seed, puedes usar estas credenciales para login:

**Administrador:**
- Email: `admin@clinicafisio.com`
- Password: `Admin123!`

**Fisioterapeuta:**
- Email: `maria.garcia@clinicafisio.com`
- Password: `Fisio123!`

**Paciente:**
- Email: `carlos.rodriguez@email.com`
- Password: `Patient123!`

## 🔧 Problemas Comunes y Soluciones

### ❌ Error: "Cannot connect to database"
```bash
# Verificar que Docker esté corriendo
docker --version
docker-compose --version

# Verificar contenedores
docker-compose ps

# Si no están corriendo, levantarlos
cd backend
docker-compose up -d
```

### ❌ Error: "PrismaClient is not generated"
```bash
cd backend
pnpm prisma generate
```

### ❌ Error: "Table doesn't exist"
```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
```

### ❌ Error: "JWT token invalid" o problemas de login
- Asegúrate que las variables `JWT_SECRET` y `JWT_REFRESH_SECRET` estén configuradas en `.env`
- Verifica que el backend esté corriendo en el puerto 3000
- Revisa que no haya errores en la consola del backend

### ❌ Error: "Port 3000 already in use"
```bash
# Matar proceso que usa el puerto
lsof -ti:3000 | xargs kill -9

# O cambiar el puerto en el archivo .env
PORT=3001
```

### ❌ Error con pnpm
Si no tienes pnpm instalado:
```bash
npm install -g pnpm
```

O puedes usar npm en su lugar:
```bash
npm install
npm run start:dev
```

## 🚀 Verificación Final

1. **Backend**: Ve a http://localhost:3000/api/docs - deberías ver la documentación de Swagger
2. **Database**: Las tablas deberían estar creadas con datos de prueba
3. **Login**: Prueba hacer login con las credenciales de arriba
4. **Mobile App**: La app debería conectarse al backend en localhost:3000

## 📞 ¿Necesitas Ayuda?

Si sigues teniendo problemas después de seguir esta guía:

1. Comparte la salida completa del error en la consola
2. Verifica que todos los servicios estén corriendo:
   ```bash
   # Backend
   curl http://localhost:3000/api/docs
   
   # Database
   docker-compose ps
   ```
3. Revisa los logs del backend para más detalles:
   ```bash
   cd backend
   docker-compose logs -f
   ```

## 🔄 Comandos Útiles para el Día a Día

```bash
# Backend
cd backend
pnpm start:dev          # Iniciar backend
pnpm prisma studio      # Ver base de datos en navegador
docker-compose down     # Parar servicios
docker-compose up -d    # Iniciar servicios

# Mobile App  
cd mobile-app
pnpm start              # Iniciar Expo
pnpm ios                # Abrir en iOS Simulator
pnpm android            # Abrir en Android Emulator
pnpm web                # Abrir en navegador web
```