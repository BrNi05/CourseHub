export type FacultyUserCountRow = {
  universityId: string;
  uniAbbrev: string;
  facultyId: string | null;
  facultyName: string | null;
  userCount: number;
};

export type UniversityUserCountRow = {
  universityId: string;
  uniAbbrev: string;
  userCount: number;
};
