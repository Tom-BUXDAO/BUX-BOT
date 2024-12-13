-- First copy any non-null buxBalance values to a backup table
CREATE TABLE IF NOT EXISTS "BuxBalanceBackup" (
    "discordId" TEXT PRIMARY KEY,
    "buxBalance" BIGINT,
    "backupDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "BuxBalanceBackup" ("discordId", "buxBalance")
SELECT "discordId", "buxBalance"
FROM "Roles"
WHERE "buxBalance" IS NOT NULL;

-- Now safe to drop the column
ALTER TABLE "Roles" DROP COLUMN IF EXISTS "buxBalance"; 