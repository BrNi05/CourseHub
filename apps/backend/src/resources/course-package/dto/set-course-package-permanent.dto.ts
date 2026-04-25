import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCoursePackagePermanentDto {
  @ApiProperty({
    example: true,
    description: 'Whether the package should be treated as permanent.',
  })
  @IsBoolean({ message: 'isPermanent must be a boolean' })
  isPermanent!: boolean;
}
