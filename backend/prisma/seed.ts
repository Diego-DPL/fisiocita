import { PrismaClient, UserRole, ActivityType, ActivityDifficulty, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Crear clínica de ejemplo
  const clinic = await prisma.clinic.upsert({
    where: { email: 'info@clinicafisio.com' },
    update: {},
    create: {
      name: 'Clínica Fisioterapia Demo',
      email: 'info@clinicafisio.com',
      phone: '+34 912 345 678',
      address: 'Calle Principal 123',
      city: 'Madrid',
      country: 'España',
      timezone: 'Europe/Madrid',
    },
  });

  console.log('✅ Clínica creada:', clinic.name);

  // 2. Crear usuario administrador
  const hashedPasswordAdmin = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      clinicId: clinic.id,
      email: 'admin@clinicafisio.com',
      password: hashedPasswordAdmin,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: UserRole.ADMIN,
      phone: '+34 600 000 001',
    },
  });

  console.log('✅ Usuario admin creado:', adminUser.email);

  // 3. Crear fisioterapeutas
  const hashedPasswordFisio = await bcrypt.hash('Fisio123!', 10);

  const fisio1User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'maria.garcia@clinicafisio.com',
      password: hashedPasswordFisio,
      firstName: 'María',
      lastName: 'García',
      role: UserRole.PHYSIOTHERAPIST,
      phone: '+34 600 000 002',
    },
  });

  const fisio1 = await prisma.physiotherapist.create({
    data: {
      clinicId: clinic.id,
      userId: fisio1User.id,
      licenseNumber: 'FIS-001-2024',
      specialization: 'Traumatología deportiva',
      bio: 'Especialista en rehabilitación de lesiones deportivas con 10 años de experiencia.',
      yearsOfExperience: 10,
    },
  });

  console.log('✅ Fisioterapeuta creada:', fisio1User.firstName, fisio1User.lastName);

  const fisio2User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'juan.lopez@clinicafisio.com',
      password: hashedPasswordFisio,
      firstName: 'Juan',
      lastName: 'López',
      role: UserRole.PHYSIOTHERAPIST,
      phone: '+34 600 000 003',
    },
  });

  const fisio2 = await prisma.physiotherapist.create({
    data: {
      clinicId: clinic.id,
      userId: fisio2User.id,
      licenseNumber: 'FIS-002-2024',
      specialization: 'Pilates terapéutico',
      bio: 'Experto en pilates terapéutico y reeducación postural.',
      yearsOfExperience: 8,
    },
  });

  console.log('✅ Fisioterapeuta creado:', fisio2User.firstName, fisio2User.lastName);

  // 4. Crear pacientes
  const hashedPasswordPatient = await bcrypt.hash('Patient123!', 10);

  const patient1User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'carlos.rodriguez@email.com',
      password: hashedPasswordPatient,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: UserRole.PATIENT,
      phone: '+34 600 111 001',
    },
  });

  await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      userId: patient1User.id,
      dateOfBirth: new Date('1985-03-15'),
      gender: 'M',
      address: 'Calle Secundaria 45',
      emergencyContact: '+34 600 222 001',
      medicalHistory: 'Operación de rodilla en 2020',
    },
  });

  const patient2User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'ana.martinez@email.com',
      password: hashedPasswordPatient,
      firstName: 'Ana',
      lastName: 'Martínez',
      role: UserRole.PATIENT,
      phone: '+34 600 111 002',
    },
  });

  await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      userId: patient2User.id,
      dateOfBirth: new Date('1990-07-22'),
      gender: 'F',
      address: 'Avenida Principal 78',
      emergencyContact: '+34 600 222 002',
    },
  });

  console.log('✅ Pacientes creados');

  // 5. Crear disponibilidad para fisioterapeutas
  const workingDays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];

  for (const day of workingDays) {
    // Fisio 1: Mañanas (09:00 - 14:00)
    await prisma.availability.create({
      data: {
        clinicId: clinic.id,
        physiotherapistId: fisio1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '14:00',
      },
    });

    // Fisio 2: Tardes (15:00 - 20:00)
    await prisma.availability.create({
      data: {
        clinicId: clinic.id,
        physiotherapistId: fisio2.id,
        dayOfWeek: day,
        startTime: '15:00',
        endTime: '20:00',
      },
    });
  }

  console.log('✅ Disponibilidades creadas');

  // 6. Crear actividades grupales
  const pilatesActivity = await prisma.activity.create({
    data: {
      clinicId: clinic.id,
      physiotherapistId: fisio2.id,
      name: 'Pilates Terapéutico',
      description: 'Clase de pilates enfocada en la rehabilitación y fortalecimiento del core.',
      type: ActivityType.PILATES,
      difficulty: ActivityDifficulty.INTERMEDIATE,
      maxParticipants: 8,
      durationMinutes: 60,
      price: 15.00,
    },
  });

  await prisma.activitySchedule.create({
    data: {
      clinicId: clinic.id,
      activityId: pilatesActivity.id,
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '18:00',
      endTime: '19:00',
    },
  });

  await prisma.activitySchedule.create({
    data: {
      clinicId: clinic.id,
      activityId: pilatesActivity.id,
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '18:00',
      endTime: '19:00',
    },
  });

  console.log('✅ Actividad de Pilates creada con horarios');

  const yogaActivity = await prisma.activity.create({
    data: {
      clinicId: clinic.id,
      physiotherapistId: fisio1.id,
      name: 'Yoga Restaurativo',
      description: 'Sesión de yoga suave para mejorar la flexibilidad y reducir el estrés.',
      type: ActivityType.YOGA,
      difficulty: ActivityDifficulty.BEGINNER,
      maxParticipants: 10,
      durationMinutes: 60,
      price: 12.00,
    },
  });

  await prisma.activitySchedule.create({
    data: {
      clinicId: clinic.id,
      activityId: yogaActivity.id,
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '10:00',
      endTime: '11:00',
    },
  });

  await prisma.activitySchedule.create({
    data: {
      clinicId: clinic.id,
      activityId: yogaActivity.id,
      dayOfWeek: DayOfWeek.THURSDAY,
      startTime: '10:00',
      endTime: '11:00',
    },
  });

  console.log('✅ Actividad de Yoga creada con horarios');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Admin: admin@clinicafisio.com / Admin123!');
  console.log('   Fisio: maria.garcia@clinicafisio.com / Fisio123!');
  console.log('   Paciente: carlos.rodriguez@email.com / Patient123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
