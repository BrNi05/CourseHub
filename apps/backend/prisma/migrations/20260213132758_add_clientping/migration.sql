-- CreateEnum
CREATE TYPE "ClientPlatform" AS ENUM ('windows', 'linux', 'macos', 'android', 'ios');

-- CreateTable
CREATE TABLE "ClientPing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "platform" "ClientPlatform" NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "ClientPing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientPing_date_idx" ON "ClientPing"("date");

-- CreateIndex
CREATE INDEX "ClientPing_platform_idx" ON "ClientPing"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPing_userId_date_key" ON "ClientPing"("userId", "date");

-- AddForeignKey
ALTER TABLE "ClientPing" ADD CONSTRAINT "ClientPing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
