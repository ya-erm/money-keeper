/*
  Warnings:

  - You are about to drop the column `version` on the `Journal` table. All the data in the column will be lost.
  - You are about to drop the column `ecryptedKey` on the `Member` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "Journal" DROP COLUMN "version";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "ecryptedKey",
ADD COLUMN     "encryptedKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "uuid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Group_uuid_key" ON "Group"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");
