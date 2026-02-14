import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsUUID, Length } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Databases', description: 'Name of the course' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ example: 'BMEVITMAB04', description: 'Course code' })
  @IsString()
  @Length(1, 50)
  code!: string;

  @ApiProperty({ example: 'faculty-uuid', description: 'ID of the parent faculty' })
  @IsUUID('4', { message: 'facultyId must be a valid UUID' })
  facultyId!: string;

  @ApiProperty({
    example: 'https://www.db.bme.hu/adatbazisok/BMEVITMAB04',
    description: "URL to the lecturer's course page, if available",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'coursePageUrl must be a valid URL' })
  coursePageUrl?: string;

  @ApiProperty({
    example: 'https://portal.vik.bme.hu/kepzes/targyak/VITMAB04/',
    description: "URL to the course's TAD page, if available",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'courseTadUrl must be a valid URL' })
  courseTadUrl?: string;

  @ApiProperty({
    example: 'https://edu.vik.bme.hu/course/view.php?id=12345',
    description: "URL to the course's Moodle page, if available",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'courseMoodleUrl must be a valid URL' })
  courseMoodleUrl?: string;

  @ApiProperty({
    example: 'https://teams.microsoft.com/l/team/...',
    description: "URL to the course's Microsoft Teams group, if available",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'courseTeamsUrl must be a valid URL' })
  courseTeamsUrl?: string;

  @ApiProperty({
    example: 'https://vik.wiki/Adatb%C3%A1zisok',
    description: 'URL to additional course resources (Wiki, GitHub, etc.), if available',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'courseExtraUrl must be a valid URL' })
  courseExtraUrl?: string;
}
