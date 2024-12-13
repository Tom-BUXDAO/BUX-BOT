-- First, backup the buxBalance data
CREATE TABLE IF NOT EXISTS "TokenBalance" (
  "walletAddress" TEXT PRIMARY KEY,
  "balance" BIGINT DEFAULT 0,
  "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "ownerDiscordId" TEXT
);

-- Copy existing balances to new table
INSERT INTO "TokenBalance" ("ownerDiscordId", "balance")
SELECT "discordId", "buxBalance"::BIGINT
FROM "Roles"
WHERE "buxBalance" IS NOT NULL
ON CONFLICT ("walletAddress") DO UPDATE
SET "balance" = EXCLUDED.balance;

-- Now safe to drop the column
ALTER TABLE "Roles" DROP COLUMN IF EXISTS "buxBalance"; 