import { Module } from '@nestjs/common';
import { ClinicRequestsController } from './clinic-requests.controller';
import { ClinicRequestsService } from './clinic-requests.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicRequestsController],
  providers: [ClinicRequestsService],
  exports: [ClinicRequestsService],
})
export class ClinicRequestsModule {}
