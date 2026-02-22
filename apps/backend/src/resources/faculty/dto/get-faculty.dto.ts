import { IsUUIDCustom } from '../../../decorators/validators/uuid-custom.decorator.js';

export class GetFacultiesQueryDto {
  @IsUUIDCustom(
    'universityId must be a valid UUID',
    'uuid-of-university',
    'UUID of the university to list faculties for'
  )
  universityId!: string;
}
