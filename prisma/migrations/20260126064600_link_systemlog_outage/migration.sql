-- AlterTable
ALTER TABLE "SystemLog" ADD COLUMN     "outageBatchId" TEXT;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_outageBatchId_fkey" FOREIGN KEY ("outageBatchId") REFERENCES "OutageBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
