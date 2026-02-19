import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateFacultyDto } from './create-faculty.dto.js';

export class UpdateFacultyDto extends PartialType(
  OmitType(CreateFacultyDto, ['universityId'] as const)
) {}
