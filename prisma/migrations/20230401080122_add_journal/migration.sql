-- AlterTable
ALTER TABLE "AuthToken" ADD COLUMN     "uuid" TEXT;

-- CreateTable
CREATE TABLE "Member" (
    "uuid" TEXT NOT NULL,
    "login" TEXT,
    "publicKey" TEXT NOT NULL,
    "ecryptedKey" TEXT,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Journal" (
    "ownerUuid" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("ownerUuid","order")
);

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_ownerUuid_fkey" FOREIGN KEY ("ownerUuid") REFERENCES "Member"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
