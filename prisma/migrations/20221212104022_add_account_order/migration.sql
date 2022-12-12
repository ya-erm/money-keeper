-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_linkedTransactionId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
