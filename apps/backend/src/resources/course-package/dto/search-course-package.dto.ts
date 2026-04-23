import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SearchCoursePackageDto {
  @ApiPropertyOptional({
    example: 'uuid-of-university',
    description: 'Filter packages by university ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'universityId must be a valid UUID' })
  universityId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-faculty',
    description: 'Filter packages by faculty ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'facultyId must be a valid UUID' })
  facultyId?: string;

  @ApiPropertyOptional({
    example: 'spring',
    description: 'Case-insensitive partial match against the package name',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsOptional()
  @IsString({ message: 'A keresési kifejezés csak szöveg lehet.' })
  @MaxLength(128, { message: 'A keresési kifejezés legfeljebb 128 karakter hosszú lehet.' })
  nameQuery?: string;
}
