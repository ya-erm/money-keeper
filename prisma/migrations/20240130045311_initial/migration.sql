-- CreateTable
CREATE TABLE "Member" (
    "uuid" TEXT NOT NULL,
    "login" TEXT,
    "publicKey" TEXT NOT NULL,
    "encryptedKey" TEXT,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "MemberToken" (
    "value" TEXT NOT NULL,
    "memberUuid" TEXT NOT NULL,
    "invalidated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberToken_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "Journal" (
    "ownerUuid" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "encryption" TEXT NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("ownerUuid","order")
);

-- AddForeignKey
ALTER TABLE "MemberToken" ADD CONSTRAINT "MemberToken_memberUuid_fkey" FOREIGN KEY ("memberUuid") REFERENCES "Member"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_ownerUuid_fkey" FOREIGN KEY ("ownerUuid") REFERENCES "Member"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
