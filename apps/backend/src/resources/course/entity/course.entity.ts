import { ApiProperty } from '@nestjs/swagger';
import { Timestamp } from '../../../common/models/timestamp.model.js';

export class Course extends Timestamp {
  @ApiProperty({
    example: 'd69f4fcb-1579-45c1-a91c-cc800d489343',
    description: 'Auto-generated ID of the course',
  })
  id!: string;

  @ApiProperty({ example: 'Databases', description: 'Name of the course' })
  name!: string;

  @ApiProperty({ example: 'BMEVITMAB04', description: 'Course code' })
  code!: string;

  @ApiProperty({
    example: '95fda989-1535-4d60-8792-a700a83c4122',
    description: 'ID of the parent faculty',
  })
  facultyId!: string;

  // pinnedBy[] is intentionally not included here
  // Handling course pinning is done from the users direction (endpoints)

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
    example: 'https://teams.microsoft.com/l/team/...',
    description: "URL to the course's Microsoft Teams group, if available",
  })
  courseTeamsUrl?: string;

  @ApiProperty({
    example: 'https://vik.wiki/Adatb%C3%A1zisok',
    description: 'URL to additional course resources (Wiki, GitHub, etc.), if available',
  })
  courseExtraUrl?: string;

  constructor(course: Partial<Course>) {
    super(course);
    Object.assign(this, course);
  }
}
