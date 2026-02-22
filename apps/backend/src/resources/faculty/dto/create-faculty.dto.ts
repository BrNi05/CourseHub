import { IsValidString } from '../../../decorators/validators/string.dto.js';
import { IsUUIDCustom } from '../../../decorators/validators/uuid-custom.decorator.js';

export class CreateFacultyDto {
  @IsValidString('Faculty of Engineering', 'Name of the faculty', 2, 96)
  name!: string;

  @IsValidString('FEEI', 'Abbreviated name of the faculty', 2, 8)
  abbrevName!: string;

  @IsUUIDCustom(
    'universityId must be a valid UUID',
    'uuid-of-parent-university',
    'ID of the parent university'
  )
  universityId!: string;
}
