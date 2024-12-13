-- Drop existing tables
DROP TABLE IF EXISTS "RoleChange";
DROP TABLE IF EXISTS "RoleSync";

-- Create new RoleSync table with correct structure
CREATE TABLE "RoleSync" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "added" TEXT[],
    "removed" TEXT[],
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleSync_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "RoleSync_discordId_idx" ON "RoleSync"("discordId");
CREATE INDEX "RoleSync_timestamp_idx" ON "RoleSync"("timestamp"); 