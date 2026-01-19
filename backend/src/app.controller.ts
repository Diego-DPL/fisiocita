import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  getRoot(): any {
    return this.appService.getRoot();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth(): any {
    return this.appService.getHealth();
  }
}
