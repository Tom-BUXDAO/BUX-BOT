CREATE OR REPLACE FUNCTION check_main_collections(user_discord_id TEXT) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_all_collections BOOLEAN;
BEGIN
    SELECT 
        bool_and(count > 0) INTO has_all_collections
    FROM (
        SELECT collection, COUNT(*) as count
        FROM "NFT"
        WHERE "ownerDiscordId" = user_discord_id
        AND collection IN (
            'ai_bitbots',
            'fcked_catz',
            'money_monsters',
            'money_monsters3d',
            'celebcatz'
        )
        GROUP BY collection
    ) counts;
    
    RETURN COALESCE(has_all_collections, false);
END;
$$; 