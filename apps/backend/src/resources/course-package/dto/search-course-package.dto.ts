/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IsUUIDCustom } from '../../../decorators/validators/uuid-custom.decorator.js';
import { IsValidString } from '../../../decorators/validators/string.dto.js';

export class SearchCoursePackageDto {
  @IsUUIDCustom(
    'universityId must be a valid UUID',
    'uuid-of-university',
    'Filter packages by university ID',
    false
  )
  universityId?: string;

  @IsUUIDCustom(
    'facultyId must be a valid UUID',
    'uuid-of-faculty',
    'Filter packages by faculty ID',
    false
  )
  facultyId?: string;

  @IsValidString(
    'Keresési kifejezés',
    'Adatb',
    'Case-insensitive partial match against the package name',
    1,
    128,
    false,
    ({ value }) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }
  )
  nameQuery?: string;
}
