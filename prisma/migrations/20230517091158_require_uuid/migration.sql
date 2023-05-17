/*
  Warnings:

  - Made the column `uuid` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `AuthToken` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `CurrencyRate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `Group` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `ImportRule` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `Invite` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `Tag` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `Transaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "AuthToken" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "CurrencyRate" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "ImportRule" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "uuid" SET NOT NULL;
