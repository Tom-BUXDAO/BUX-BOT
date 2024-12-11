CREATE OR REPLACE FUNCTION sync_user_roles(user_discord_id TEXT) 
RETURNS void 
LANGUAGE plpgsql
AS $function$
DECLARE
    bux_total NUMERIC;
    nft_counts RECORD;
    user_name TEXT;
    has_all_main_collections BOOLEAN;
BEGIN
    -- Get user's Discord name
    SELECT "discordName" INTO user_name
    FROM "User"
    WHERE "discordId" = user_discord_id;

    -- Get total BUX balance
    SELECT COALESCE(SUM(balance), 0)::NUMERIC INTO bux_total
    FROM "TokenBalance"
    WHERE "ownerDiscordId" = user_discord_id;
    
    -- Check for all main collections
    SELECT bool_and(count > 0) INTO has_all_main_collections
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
    ) main_collections;

    -- Get NFT counts
    WITH nft_summary AS (
        SELECT collection, COUNT(*) as count
        FROM "NFT"
        WHERE "ownerDiscordId" = user_discord_id
        GROUP BY collection
    )
    SELECT 
        COALESCE(SUM(count) FILTER (WHERE collection = 'ai_bitbots'), 0) as ai_bitbots_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'fcked_catz'), 0) as fcked_catz_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'money_monsters'), 0) as money_monsters_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'money_monsters3d'), 0) as money_monsters3d_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'celebcatz'), 0) as celebcatz_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'candy_bots'), 0) as candy_bots_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'doodle_bot'), 0) as doodle_bot_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'energy_apes'), 0) as energy_apes_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'rjctd_bots'), 0) as rjctd_bots_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'squirrels'), 0) as squirrels_count,
        COALESCE(SUM(count) FILTER (WHERE collection = 'warriors'), 0) as warriors_count
    INTO nft_counts
    FROM nft_summary;

    -- Update roles
    UPDATE "Roles"
    SET 
        "buxDao5" = COALESCE(has_all_main_collections, false),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "discordId" = user_discord_id;
END;
$function$; 