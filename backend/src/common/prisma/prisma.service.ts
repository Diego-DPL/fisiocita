import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Prisma shutdown hook
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  // Helper para aplicar filtro de clinic_id automáticamente
  async withClinicId<T>(clinicId: string, operation: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    // Aquí se puede implementar Row Level Security a nivel de aplicación
    // o asegurar que todas las queries incluyan clinic_id
    return operation(this);
  }
}
