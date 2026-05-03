import type { Course } from '@coursehub/sdk';

// Dedupes and sorts courses by name
export function dedupeCourses(courses: Course[]) {
  const seen = new Set<string>();

  return courses
    .filter((course) => {
      if (!course.id || seen.has(course.id)) return false;
      seen.add(course.id);
      return true;
    })
    .map((course) => ({
      // Ensure credits is a number (default: 0)
      ...course,
      credits: Number.isFinite(Number(course.credits)) ? Number(course.credits) : 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'hu', { sensitivity: 'base' }));
}
