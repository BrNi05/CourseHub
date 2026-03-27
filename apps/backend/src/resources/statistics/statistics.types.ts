// getUserStatistics()
export type FacultyUserCountRow = {
  universityId: string;
  uniAbbrev: string;
  facultyId: string | null;
  facultyName: string | null;
  userCount: number;
};

// getUserStatistics()
export type UniversityUserCountRow = {
  universityId: string;
  uniAbbrev: string;
  userCount: number;
};

// getPinStatistics()
export type CoursePinCountRow = {
  name: string;
  universityAbbrev: string;
  courseCode: string;
  pinCount: number;
};

// getCourseStatistics()
export type FacultyCourseCountRow = {
  universityId: string;
  universityAbbrevName: string;
  facultyId: string | null;
  facultyName: string | null;
  courseCount: number;
};

// getCourseStatistics()
export type UniversityCourseCountRow = {
  universityId: string;
  universityAbbrevName: string;
  courseCount: number;
};
