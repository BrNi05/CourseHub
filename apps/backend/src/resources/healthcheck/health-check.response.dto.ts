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

  constructor(status: string, interpretation: string, timestamp: number, version: string) {
    this.status = status;
    this.interpretation = interpretation;
    this.timestamp = timestamp;
    this.version = version;
  }
}
