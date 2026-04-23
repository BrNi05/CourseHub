export type LoginCourseSyncDecisionInput = {
  pendingLoginResult: string | null;
  localCourseCount: number;
  serverCourseCount: number;
};

export function shouldSyncLocalCoursesAfterLogin({
  pendingLoginResult,
  localCourseCount,
  serverCourseCount,
}: LoginCourseSyncDecisionInput): boolean {
  return pendingLoginResult === 'success' && localCourseCount > 0 && serverCourseCount === 0;
}
