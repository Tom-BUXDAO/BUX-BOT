-- Update NULL thresholds to 0
UPDATE "RoleConfig"
SET threshold = 0
WHERE threshold IS NULL;

-- Fix NULL values in buxDao5 column
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