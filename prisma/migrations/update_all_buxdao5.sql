UPDATE "Roles" r
SET "buxDao5" = (
    SELECT bool_and(count > 0)
    FROM (
        SELECT collection, COUNT(*) as count
        FROM "NFT"
        WHERE "ownerDiscordId" = r."discordId"
        AND collection IN (
            'ai_bitbots',
            'fcked_catz',
            'money_monsters',
            'money_monsters3d',
            'celebcatz'
        )
        GROUP BY collection
    ) counts
); 