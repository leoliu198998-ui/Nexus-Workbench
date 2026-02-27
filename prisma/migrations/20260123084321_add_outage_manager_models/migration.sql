-- CreateEnum
CREATE TYPE "OutageStatus" AS ENUM ('CREATED', 'NOTIFIED', 'STARTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "ReleaseEnvironment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutageBatch" (
    "id" TEXT NOT NULL,
    "envId" TEXT NOT NULL,
    "batchName" TEXT NOT NULL,
    "releaseDatetime" TIMESTAMP(3) NOT NULL,
    "releaseTimeZone" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "remoteBatchId" TEXT,
    "status" "OutageStatus" NOT NULL DEFAULT 'CREATED',
    "token" TEXT NOT NULL,
    "logs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutageBatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OutageBatch" ADD CONSTRAINT "OutageBatch_envId_fkey" FOREIGN KEY ("envId") REFERENCES "ReleaseEnvironment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
