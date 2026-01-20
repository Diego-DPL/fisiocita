import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Common modules
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { UsersModule } from './modules/users/users.module';
import { PhysiotherapistsModule } from './modules/physiotherapists/physiotherapists.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ClinicRequestsModule } from './modules/clinic-requests/clinic-requests.module';

// App controller and service
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Bull Queue (Redis)
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }),
    }),

    // Common modules
    PrismaModule,
    LoggerModule,

    // Feature modules
    AuthModule,
    ClinicsModule,
    UsersModule,
    PhysiotherapistsModule,
    PatientsModule,
    AppointmentsModule,
    ActivitiesModule,
    CalendarModule,
    ClinicRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
