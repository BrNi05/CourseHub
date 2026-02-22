import { IsPinnedCourses } from '../../../decorators/validators/pinned-courses.dto.js';

export class UpdatePinnedCoursesDto {
  @IsPinnedCourses()
  pinnedCourses?: string[]; // course IDs
}
