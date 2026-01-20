# Guía de Pruebas - Fisiocita App

## Datos de Prueba Disponibles

### 🔐 Credenciales de Acceso

#### Admin
- **Email**: admin@clinicafisio.com
- **Password**: Admin123!

#### Fisioterapeutas
1. **María García** (Traumatología deportiva)
   - Email: maria.garcia@clinicafisio.com
   - Password: Fisio123!
   - Horario: Lunes a Viernes, 09:00 - 14:00
   - Actividad: Yoga Restaurativo (Martes y Jueves 10:00-11:00)

2. **Juan López** (Pilates terapéutico)
   - Email: juan.lopez@clinicafisio.com
   - Password: Fisio123!
   - Horario: Lunes a Viernes, 15:00 - 20:00
   - Actividad: Pilates Terapéutico (Lunes y Miércoles 18:00-19:00)

#### Pacientes
1. **Carlos Rodríguez**
   - Email: carlos.rodriguez@email.com
   - Password: Patient123!

2. **Ana Martínez**
   - Email: ana.martinez@email.com
   - Password: Patient123!

---

## 🧪 Escenarios de Prueba

### 1. Login como Paciente
```
Email: carlos.rodriguez@email.com
Password: Patient123!
```

**Flujo de prueba:**
1. Abrir app
2. Introducir credenciales
3. Hacer clic en "Iniciar Sesión"
4. Verificar que aparece el Dashboard con opciones de paciente

---

### 2. Crear Cita (Paciente)

**Requisitos previos:** Backend corriendo en `http://localhost:3000`

**Pasos:**
1. Login como **carlos.rodriguez@email.com**
2. En Dashboard, clic en "Nueva Cita" ➕
3. **Seleccionar Fisioterapeuta:**
   - María García (mañanas) o Juan López (tardes)
4. **Seleccionar Fecha:**
   - Elegir día entre lunes y viernes (tienen disponibilidad)
5. **Seleccionar Horario:**
   - Para María: 09:00 - 14:00
   - Para Juan: 15:00 - 20:00
6. **Completar formulario:**
   - Motivo: "Dolor de espalda"
   - Notas (opcional): "Primera visita"
7. Clic en "Agendar Cita"

**Resultado esperado:**
- Alert de "Cita Creada"
- Opción para ver "Mis citas"

---

### 3. Reservar Actividad Grupal (Paciente)

**Pasos:**
1. Login como **carlos.rodriguez@email.com**
2. Dashboard → "Actividades Disponibles" 🏃
3. Ver 2 actividades:
   - **Pilates Terapéutico** (8 plazas)
   - **Yoga Restaurativo** (10 plazas)
4. Clic en tarjeta de actividad
5. Clic en "Reservar Plaza"
6. **Seleccionar horario:**
   - Pilates: Lunes o Miércoles 18:00
   - Yoga: Martes o Jueves 10:00
7. **Seleccionar fecha** (próximos 14 días)
8. Agregar notas (opcional)
9. Clic en "Confirmar Reserva"

**Resultado esperado:**
- Alert de "Reserva Confirmada"
- Contador de plazas disponibles actualizado

---

### 4. Ver Mis Citas (Paciente/Fisio)

**Pasos:**
1. Dashboard → "Mis Citas" 📋
2. Aplicar filtros:
   - Todas
   - Pendiente
   - Confirmada
   - Completada
3. Verificar lista de citas
4. Para fisioterapeuta: botón "Completar" en citas confirmadas
5. Para todos: botón "Cancelar" en citas no finalizadas

---

### 5. Ver Mis Reservas (Paciente)

**Pasos:**
1. Dashboard → "Mis Reservas" 🎟️
2. Ver lista de actividades reservadas
3. Verificar estado (Pendiente/Confirmada/Asistida/Cancelada)
4. Botón "Cancelar Reserva" para sesiones futuras

---

### 6. Login como Fisioterapeuta

```
Email: maria.garcia@clinicafisio.com
Password: Fisio123!
```

**Opciones disponibles:**
- Mis Citas (ver todas las citas agendadas)
- Mis Actividades (ver actividades grupales que imparto)
- Nueva Cita (agendar cita para un paciente)
- Mi Agenda (vista de calendario)
- Mi Perfil (editar datos)

---

### 7. Editar Perfil

**Todos los roles:**
1. Ir a tab "Perfil" 👤
2. Clic en "Editar Perfil"
3. Modificar:
   - Nombre
   - Apellido
   - Teléfono
4. **Solo Pacientes:**
   - Fecha de nacimiento
5. **Solo Fisioterapeutas:**
   - Especialidades (agregar/eliminar tags)
6. Clic en "Guardar Cambios"

---

## 🚀 Iniciar Backend

```bash
cd backend
pnpm start:dev
```

**Verificar que esté corriendo:**
- API Docs: http://localhost:3000/api/v1/docs
- Health Check: http://localhost:3000/health

---

## 🚀 Iniciar Mobile App

```bash
cd mobile-app
pnpm start
```

**Opciones:**
- Presionar `i` para iOS Simulator
- Presionar `a` para Android Emulator
- Escanear QR con Expo Go en dispositivo físico

---

## 🐛 Troubleshooting

### Backend no responde
```bash
# Verificar que PostgreSQL esté corriendo
docker ps

# Reiniciar contenedores
cd backend
docker-compose up -d

# Ver logs del backend
pnpm start:dev
```

### App no carga fisioterapeutas
1. Verificar que backend esté en `http://localhost:3000`
2. Abrir consola del navegador (web) o logs de Expo
3. Buscar mensajes: "📋 Cargando fisioterapeutas..."
4. Si hay error 401: verificar que el token JWT esté guardado

### Slots no aparecen
1. Verificar que has seleccionado un día entre **Lunes y Viernes**
2. Los sábados y domingos NO tienen disponibilidad por defecto
3. Verificar console logs: "🕐 Cargando slots..."

---

## 📊 Estructura de Horarios

### María García (Fisio 1)
```
Lunes    09:00-14:00 ✅
Martes   09:00-14:00 ✅ + Yoga 10:00-11:00
Miércoles 09:00-14:00 ✅
Jueves   09:00-14:00 ✅ + Yoga 10:00-11:00
Viernes  09:00-14:00 ✅
```

### Juan López (Fisio 2)
```
Lunes    15:00-20:00 ✅ + Pilates 18:00-19:00
Martes   15:00-20:00 ✅
Miércoles 15:00-20:00 ✅ + Pilates 18:00-19:00
Jueves   15:00-20:00 ✅
Viernes  15:00-20:00 ✅
```

**Nota:** Las actividades grupales bloquean el horario del fisioterapeuta para citas individuales.

---

## 🔄 Resetear Datos de Prueba

```bash
cd backend
pnpm prisma migrate reset --force
```

Esto:
1. Borra toda la base de datos
2. Ejecuta las migraciones
3. Ejecuta el seed con datos de prueba frescos
