-- CreateTable
CREATE TABLE "MemberToken" (
    "value" TEXT NOT NULL,
    "memberUuid" TEXT NOT NULL,
    "invalidated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberToken_pkey" PRIMARY KEY ("value")
);

-- AddForeignKey
ALTER TABLE "MemberToken" ADD CONSTRAINT "MemberToken_memberUuid_fkey" FOREIGN KEY ("memberUuid") REFERENCES "Member"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
