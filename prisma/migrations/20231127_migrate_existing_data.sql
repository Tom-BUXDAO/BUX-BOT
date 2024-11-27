-- Create UserWallet table
CREATE TABLE IF NOT EXISTS "UserWallet" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on address
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_address_key" UNIQUE ("address");

-- Add foreign key constraint
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing wallet addresses from User table to UserWallet
INSERT INTO "UserWallet" ("id", "address", "userId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "walletAddress",
    "id",
    "createdAt",
    CURRENT_TIMESTAMP
FROM "User"
WHERE "walletAddress" IS NOT NULL;

-- Drop walletAddress column from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "walletAddress"; 