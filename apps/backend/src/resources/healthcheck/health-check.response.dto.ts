import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ example: 'ok', description: 'The status of the service' })
  status: string;

  @ApiProperty({
    example: 'Short term load spike',
    description: 'A human-readable interpretation of the load averages and status',
  })
  interpretation: string;

  @ApiProperty({
    example: 1770724602,
    description: 'Current timestamp in seconds since UNIX epoch',
  })
  timestamp: number;

  @ApiProperty({ example: '1.1.0', description: 'CourseHub backend version' })
  version: string;

  @ApiProperty({
    example: 20,
    description:
      'The average system load over the last 1 minute (normalized to the number of CPU cores)',
    required: false,
  })
  load1?: number;

  @ApiProperty({
    example: 140,
    description:
      'The average system load over the last 5 minutes (normalized to the number of CPU cores)',
    required: false,
  })
  load5?: number;

  @ApiProperty({
    example: 60,
    description:
      'The average system load over the last 15 minutes (normalized to the number of CPU cores)',
    required: false,
  })
  load15?: number;

  constructor(
    status: string,
    interpretation: string,
    timestamp: number,
    version: string,
    load1: number,
    load5: number,
    load15: number
  ) {
    this.status = status;
    this.interpretation = interpretation;
    this.timestamp = timestamp;
    this.version = version;
    this.load1 = load1;
    this.load5 = load5;
    this.load15 = load15;
  }
}
