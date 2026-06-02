export type LoginCourseSyncDecisionInput = {
  localCourseCount: number;
  serverCourseCount: number;
};

export function shouldSyncLocalCoursesAfterLogin({
  localCourseCount,
  serverCourseCount,
}: LoginCourseSyncDecisionInput): boolean {
  return localCourseCount > 0 && serverCourseCount === 0;
}
