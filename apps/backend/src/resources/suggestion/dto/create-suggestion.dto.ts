import { IsValidString } from '../../../decorators/validators/string.dto.js';
import { CourseLink, isMicrosoftTeamsUrl } from '../../../decorators/validators/course-link.dto.js';

export class CreateSuggestionDto {
  @IsValidString(
    'Budapest University of Technology and Economics',
    'Name of the university',
    10,
    64
  )
  uniName!: string;

  @IsValidString('BME', 'Abbreviated name of the university', 2, 8)
  uniAbbrevName!: string;

  @IsValidString('Faculty of Engineering', 'Name of the faculty', 2, 96)
  facultyName!: string;

  @IsValidString('FEEI', 'Abbreviated name of the faculty', 2, 8)
  facultyAbbrevName!: string;

  @IsValidString('Databases', 'Name of the course', 6, 32)
  courseName!: string;

  @IsValidString('BMEVITMAB04', 'Course code', 6, 16)
  courseCode!: string;

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
