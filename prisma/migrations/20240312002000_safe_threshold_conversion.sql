-- First backup the existing values
CREATE TABLE IF NOT EXISTS "RoleConfig_backup" AS 
SELECT * FROM "RoleConfig";

-- Fix NULL values in buxDao5 column and update based on collection ownership
WITH collection_owners AS (
    SELECT "ownerDiscordId"
    FROM "NFT"
    WHERE collection IN (
        'ai_bitbots',
        'fcked_catz',
        'money_monsters',
        'money_monsters3d',
        'celebcatz'
    )
    GROUP BY "ownerDiscordId"
    HAVING COUNT(DISTINCT collection) = 5
)
UPDATE "Roles" r
SET 
    "buxDao5" = CASE 
        WHEN EXISTS (
            SELECT 1 FROM collection_owners co 
            WHERE co."ownerDiscordId" = r."discordId"
        ) THEN true 
        ELSE false 
    END,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "buxDao5" IS NULL;

-- Convert threshold values
UPDATE "RoleConfig"
SET 
    threshold = COALESCE(
        CASE 
            WHEN threshold > 2147483647 THEN 2147483647
            ELSE threshold::INTEGER 
        END,
        0
    );