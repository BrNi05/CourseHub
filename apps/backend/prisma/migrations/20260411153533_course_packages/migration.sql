-- CreateTable
CREATE TABLE "CoursePackage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ownerId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoursePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PackageCourses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageCourses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "CoursePackage_ownerId_idx" ON "CoursePackage"("ownerId");

-- CreateIndex
CREATE INDEX "CoursePackage_facultyId_idx" ON "CoursePackage"("facultyId");

-- CreateIndex
CREATE INDEX "CoursePackage_isPermanent_lastUsedAt_idx" ON "CoursePackage"("isPermanent", "lastUsedAt");

-- CreateIndex
CREATE INDEX "_PackageCourses_B_index" ON "_PackageCourses"("B");

-- AddForeignKey
ALTER TABLE "CoursePackage" ADD CONSTRAINT "CoursePackage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePackage" ADD CONSTRAINT "CoursePackage_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCourses" ADD CONSTRAINT "_PackageCourses_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCourses" ADD CONSTRAINT "_PackageCourses_B_fkey" FOREIGN KEY ("B") REFERENCES "CoursePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
