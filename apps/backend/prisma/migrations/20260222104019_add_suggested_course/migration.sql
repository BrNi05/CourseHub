-- CreateTable
CREATE TABLE "SuggestedCourse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userEmail" TEXT NOT NULL,
    "uniName" TEXT NOT NULL,
    "uniAbbrevName" TEXT NOT NULL,
    "facultyName" TEXT NOT NULL,
    "facultyAbbrevName" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "coursePageUrl" TEXT NOT NULL DEFAULT '',
    "courseTadUrl" TEXT NOT NULL DEFAULT '',
    "courseMoodleUrl" TEXT NOT NULL DEFAULT '',
    "courseTeamsUrl" TEXT NOT NULL DEFAULT '',
    "courseExtraUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SuggestedCourse_pkey" PRIMARY KEY ("id")
);
