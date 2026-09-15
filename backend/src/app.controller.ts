import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'dubai-fans-api',
      version: '1.0.0',
    };
  }

  @Get('health/database')
  async databaseHealth() {
    const result = await this.prisma.$queryRaw<
      Array<{ result: number }>
    >`SELECT 1 as result`;

    return {
      status: 'ok',
      database: result[0]?.result === 1 ? 'connected' : 'error',
    };
  }
}
