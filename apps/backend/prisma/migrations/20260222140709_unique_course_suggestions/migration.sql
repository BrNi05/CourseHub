/*
  Warnings:

  - A unique constraint covering the columns `[courseCode]` on the table `SuggestedCourse` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SuggestedCourse_courseCode_key" ON "SuggestedCourse"("courseCode");
