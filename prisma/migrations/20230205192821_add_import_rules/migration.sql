-- CreateTable
CREATE TABLE "ImportRule" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "categoryId" INTEGER,

    CONSTRAINT "ImportRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ImportRuleToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ImportRuleToTag_AB_unique" ON "_ImportRuleToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ImportRuleToTag_B_index" ON "_ImportRuleToTag"("B");

-- AddForeignKey
ALTER TABLE "ImportRule" ADD CONSTRAINT "ImportRule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRule" ADD CONSTRAINT "ImportRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImportRuleToTag" ADD CONSTRAINT "_ImportRuleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ImportRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImportRuleToTag" ADD CONSTRAINT "_ImportRuleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
