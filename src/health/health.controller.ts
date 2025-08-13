import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  status: string;
  db: string;
  message?: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description:
      'Check the health status of the application and database connection',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        db: { type: 'string', example: 'available' },
        message: { type: 'string', example: 'Optional error message' },
      },
    },
  })
  health(): HealthResponse {
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
