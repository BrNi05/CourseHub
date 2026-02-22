import { PartialType } from '@nestjs/swagger';
import { CreateSuggestionDto } from './create-suggestion.dto.js';

export class UpdateSuggestionDto extends PartialType(CreateSuggestionDto) {}
