import { IsValidString } from '../../../decorators/validators/string.dto.js';
import { CourseLink, isMicrosoftTeamsUrl } from '../../../decorators/validators/course-link.dto.js';

export class CreateSuggestionDto {
  @IsValidString(
    'egyetem nevének',
    'Budapest University of Technology and Economics',
    'Name of the university',
    10,
    64
  )
  uniName!: string;

  @IsValidString('egyetem rövidített nevének', 'BME', 'Abbreviated name of the university', 2, 8)
  uniAbbrevName!: string;

  @IsValidString('kar nevének', 'Faculty of Engineering', 'Name of the faculty', 2, 96)
  facultyName!: string;

  @IsValidString('kar rövidített nevének', 'FEEI', 'Abbreviated name of the faculty', 2, 8)
  facultyAbbrevName!: string;

  @IsValidString('kurzus nevének', 'Databases', 'Name of the course', 6, 64)
  courseName!: string;

  @IsValidString('kurzus kódjának', 'BMEVITMAB04', 'Course code', 6, 16)
  courseCode!: string;

  @CourseLink(
    'A tárgyoldal URL-je érvénytelen!',
    'https://www.db.bme.hu/adatbazisok/BMEVITMAB04',
    "URL to the lecturer's course page, if available"
  )
  coursePageUrl?: string;

  @CourseLink(
    'A TAD oldal URL-je érvénytelen!',
    'https://portal.vik.bme.hu/kepzes/targyak/VITMAB04/',
    "URL to the course's TAD page, if available"
  )
  courseTadUrl?: string;

  @CourseLink(
    'A Moodle oldal URL-je érvénytelen!',
    'https://edu.vik.bme.hu/course/view.php?id=12345',
    "URL to the course's Moodle page, if available"
  )
  courseMoodleUrl?: string;

  @CourseLink(
    'A Teams csoport URL-je érvénytelen!',
    'https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=...',
    "URL to the course's Microsoft Teams group, if available",
    {
      validate: isMicrosoftTeamsUrl,
      validateMessage:
        'A Teams csoport URL elvárt szerkezete: https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=...',
    }
  )
  courseTeamsUrl?: string;

  @CourseLink(
    'Az extra oldal URL-je érvénytelen!',
    'https://vik.wiki/Adatb%C3%A1zisok',
    'URL to additional course resources (Wiki, GitHub, etc.), if available'
  )
  courseExtraUrl?: string;
}
