import type { Course } from '@coursehub/sdk';

export function dedupeCourses(courses: Course[]) {
  const seen = new Set<string>();

  return courses.filter((course) => {
    if (!course.id || seen.has(course.id)) return false;
    seen.add(course.id);
    return true;
  });
}
