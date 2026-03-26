-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "courseSubmissionUrl" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SuggestedCourse" ADD COLUMN     "courseSubmissionUrl" TEXT NOT NULL DEFAULT '';
