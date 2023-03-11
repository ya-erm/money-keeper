-- CreateTable
CREATE TABLE "CurrencyRate" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "cur1" TEXT NOT NULL,
    "cur2" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CurrencyRate" ADD CONSTRAINT "CurrencyRate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
