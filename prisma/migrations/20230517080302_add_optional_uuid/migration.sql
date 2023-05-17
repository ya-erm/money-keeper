/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `AuthToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `CurrencyRate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `ImportRule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "CurrencyRate" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "ImportRule" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "uuid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_uuid_key" ON "Account"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_uuid_key" ON "AuthToken"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Category_uuid_key" ON "Category"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRate_uuid_key" ON "CurrencyRate"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRule_uuid_key" ON "ImportRule"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_uuid_key" ON "Invite"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_uuid_key" ON "Tag"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_uuid_key" ON "Transaction"("uuid");
