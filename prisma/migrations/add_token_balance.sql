-- Add tokenBalance column to User table without dropping data
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenBalance" BIGINT DEFAULT 0; 