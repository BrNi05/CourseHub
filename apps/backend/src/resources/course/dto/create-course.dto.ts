import { IsValidString } from '../../../decorators/validators/string.dto.js';
import { IsUUIDCustom } from '../../../decorators/validators/uuid-custom.decorator.js';
import { CourseLink, isMicrosoftTeamsUrl } from '../../../decorators/validators/course-link.dto.js';

export class CreateCourseDto {
  @IsValidString('name', 'Databases', 'Name of the course', 6, 64)
  name!: string;

  @IsValidString('code', 'BMEVITMAB04', 'Course code', 6, 16)
  code!: string;

  @IsUUIDCustom('facultyId must be a valid UUID', 'faculty-uuid', 'ID of the parent faculty')
  facultyId!: string;

  @CourseLink(
    'coursePageUrl must be a valid URL',
    'https://www.db.bme.hu/adatbazisok/BMEVITMAB04',
    "URL to the lecturer's course page, if available"
  )
  coursePageUrl?: string;

  @CourseLink(
    'courseTadUrl must be a valid URL',
    'https://portal.vik.bme.hu/kepzes/targyak/VITMAB04/',
    "URL to the course's TAD page, if available"
  )
  courseTadUrl?: string;

  @CourseLink(
    'courseMoodleUrl must be a valid URL',
    'https://edu.vik.bme.hu/course/view.php?id=12345',
    "URL to the course's Moodle page, if available"
  )
  courseMoodleUrl?: string;

  @CourseLink(
    'courseTeamsUrl must be a valid URL',
    'https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=...',
    "URL to the course's Microsoft Teams group, if available",
    {
      validate: isMicrosoftTeamsUrl,
      validateMessage:
        'courseTeamsUrl must match https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=...',
    }
  )
  courseTeamsUrl?: string;

  @CourseLink(
    'courseExtraUrl must be a valid URL',
    'https://vik.wiki/Adatb%C3%A1zisok',
    'URL to additional course resources (Wiki, GitHub, etc.), if available'
  )
  courseExtraUrl?: string;
}
