/*
  Warnings:

  - A unique constraint covering the columns `[userId,date,platform]` on the table `ClientPing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ClientPing" DROP CONSTRAINT "ClientPing_userId_fkey";

-- DropIndex
DROP INDEX "ClientPing_userId_date_key";

-- AlterTable
ALTER TABLE "ClientPing" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ClientPing_userId_date_platform_key" ON "ClientPing"("userId", "date", "platform");

-- AddForeignKey
ALTER TABLE "ClientPing" ADD CONSTRAINT "ClientPing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
