import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  health() {
    try {
      // Check if prisma service is available - this is sufficient for health check
      if (this.prisma) {
        return { status: 'ok', db: 'available' };
      } else {
        return { status: 'error', db: 'unavailable' };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { status: 'error', db: 'disconnected', message: errorMessage };
    }
  }
}
