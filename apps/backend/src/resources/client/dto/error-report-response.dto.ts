import { ApiProperty } from '@nestjs/swagger';
import { ErrorReportDto } from './error-report.dto.js';

export class ErrorReportResponseDto extends ErrorReportDto {
  @ApiProperty({
    description: 'ID of the user who submitted the report',
    example: 'user-123',
  })
  userId!: string;

  @ApiProperty({
    description: 'ISO timestamp when the report was received',
    example: '2026-02-20T12:00:00.000Z',
  })
  receivedAt!: string;
}
