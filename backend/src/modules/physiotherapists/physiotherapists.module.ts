import { Module } from '@nestjs/common';
import { PhysiotherapistsController } from './physiotherapists.controller';
import { PhysiotherapistsService } from './physiotherapists.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PhysiotherapistsController],
  providers: [PhysiotherapistsService],
  exports: [PhysiotherapistsService],
})
export class PhysiotherapistsModule {}
