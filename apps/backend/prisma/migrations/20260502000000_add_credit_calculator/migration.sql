-- AlterTable
ALTER TABLE "Course" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SuggestedCourse" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "creditProfile" JSONB NOT NULL DEFAULT '{}';
