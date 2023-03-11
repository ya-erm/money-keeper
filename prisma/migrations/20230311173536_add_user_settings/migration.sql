-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" INTEGER NOT NULL,
    "theme" TEXT,
    "language" TEXT,
    "currency" TEXT,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
