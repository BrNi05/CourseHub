import { ApiProperty } from '@nestjs/swagger';
import { Timestamp } from '../../../common/models/timestamp.model.js';

export class SuggestedCourse extends Timestamp {
  @ApiProperty({
    example: 'd69f4fcb-1579-45c1-a91c-cc800d489343',
    description: 'Auto-generated ID of the suggested course',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the user who suggested the course',
  })
  userEmail!: string;

  @ApiProperty({
    example: 'Budapest University of Technology and Economics',
    description: 'Name of the university',
  })
  uniName!: string;

  @ApiProperty({ example: 'BME', description: 'Abbreviated name of the university' })
  uniAbbrevName!: string;

  @ApiProperty({
    example: 'Faculty of Electrical Engineering and Informatics',
    description: 'Name of the faculty',
  })
  facultyName!: string;

  @ApiProperty({
    example: 'FEEI',
    description: 'Abbreviated name of the faculty',
  })
  facultyAbbrevName!: string;

  @ApiProperty({ example: 'Databases', description: 'Name of the course' })
  courseName!: string;

  @ApiProperty({ example: 'BMEVITMAB04', description: 'Course code' })
  courseCode!: string;

  @ApiProperty({
    example: 'https://www.db.bme.hu/adatbazisok/BMEVITMAB04',
    description: "URL to the lecturer's course page, if available",
  })
  coursePageUrl?: string;

  @ApiProperty({
    example: 'https://portal.vik.bme.hu/kepzes/targyak/VITMAB04/',
    description: "URL to the course's TAD page, if available",
  })
  courseTadUrl?: string;

  @ApiProperty({
    example: 'https://edu.vik.bme.hu/course/view.php?id=12345',
    description: "URL to the course's Moodle page, if available",
  })
  courseMoodleUrl?: string;

  @ApiProperty({
    example: 'https://submit.vik.bme.hu/courses/12345',
    description: "URL to the course's submission system, if available",
  })
  courseSubmissionUrl?: string;

  @ApiProperty({
    example: 'https://teams.microsoft.com/l/team/...',
    description: "URL to the course's Microsoft Teams group, if available",
  })
  courseTeamsUrl?: string;

  @ApiProperty({
    example: 'https://vik.wiki/Adatb%C3%A1zisok',
    description: 'URL to additional course resources (Wiki, GitHub, etc.), if available',
  })
  courseExtraUrl?: string;

  constructor(suggestedCourse: Partial<SuggestedCourse>) {
    super(suggestedCourse);
    Object.assign(this, suggestedCourse);
  }
}
