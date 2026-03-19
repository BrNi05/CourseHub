import { IsValidString } from '../../../decorators/validators/string.dto.js';

export class CreateUniversityDto {
  @IsValidString(
    'name',
    'Budapest University of Technology and Economics',
    'Name of the university',
    10,
    64
  )
  name!: string;

  @IsValidString('abbrevName', 'BME', 'Abbreviated name of the university', 2, 8)
  abbrevName!: string;
}
