-- Just update NULL values to their defaults, no schema changes
UPDATE "RoleConfig"
SET threshold = 0
WHERE threshold IS NULL;

UPDATE "Roles"
SET "buxDao5" = false
WHERE "buxDao5" IS NULL;

-- Then update buxDao5 for users who actually have all collections
UPDATE "Roles" r
SET "buxDao5" = true
WHERE EXISTS (
    SELECT 1
    FROM (
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
    ) owners
    WHERE owners."ownerDiscordId" = r."discordId"
); 