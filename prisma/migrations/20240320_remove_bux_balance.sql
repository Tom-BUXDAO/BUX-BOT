-- Create backup table
CREATE TABLE IF NOT EXISTS "RolesBackup" (
  "discordId" TEXT PRIMARY KEY,
  "buxBalance" BIGINT,
  "backupDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup existing data
INSERT INTO "RolesBackup" ("discordId", "buxBalance")
SELECT "discordId", "buxBalance"
FROM "Roles"
WHERE "buxBalance" IS NOT NULL;

-- Now safe to drop the column
ALTER TABLE "Roles" DROP COLUMN IF EXISTS "buxBalance"; 