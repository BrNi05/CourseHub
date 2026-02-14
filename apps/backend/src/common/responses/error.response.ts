import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ example: 500, description: 'HTTP status code of the error' })
  statusCode!: number;

  @ApiProperty({ example: 'Internal server error', description: 'Error message' })
  message!: string;

  @ApiProperty({ example: '/api/user', description: 'Path of the endpoint that caused the error' })
  path!: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method of the request that caused the error' })
  method!: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2026-02-09T12:00:00.000Z',
    description: 'Timestamp (ISOString) of the error',
  })
  timestamp!: string;

  constructor(statusCode: number, message: string, path: string, method: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.path = path;
    this.method = method;
    this.timestamp = new Date().toISOString();
  }
}
