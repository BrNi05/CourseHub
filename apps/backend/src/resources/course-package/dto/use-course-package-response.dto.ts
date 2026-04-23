import { ApiProperty } from '@nestjs/swagger';

export class UseCoursePackageResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the package usage timestamp was updated successfully',
  })
  success!: true;
}
