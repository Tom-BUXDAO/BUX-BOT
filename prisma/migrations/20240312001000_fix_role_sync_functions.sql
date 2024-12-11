-- Fix check_main_collections function to properly handle empty/null Discord IDs
CREATE OR REPLACE FUNCTION check_main_collections(user_discord_id TEXT) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN (
        SELECT bool_and(has_collection)
        FROM (
            SELECT collection, COUNT(*) > 0 as has_collection
            FROM "NFT"
            WHERE "ownerDiscordId" = user_discord_id
            AND "ownerDiscordId" IS NOT NULL
            AND "ownerDiscordId" != ''
            AND collection IN (
                'ai_bitbots',
                'fcked_catz',
                'money_monsters',
                'money_monsters3d',
                'celebcatz'
            )
            GROUP BY collection
            HAVING COUNT(*) > 0
        ) main_collections
        HAVING COUNT(*) = 5
    );
END;
$function$;

-- Update sync_user_roles to use fixed check_main_collections
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
    
    -- Check main collections
    SELECT check_main_collections(user_discord_id) INTO has_all_main_collections;

    -- Update roles
    UPDATE "Roles"
    SET 
        "buxDao5" = has_all_main_collections,
        "buxBanker" = bux_total >= 50000000000000::NUMERIC,
        "buxSaver" = bux_total >= 25000000000000::NUMERIC AND bux_total < 50000000000000::NUMERIC,
        "buxBuilder" = bux_total >= 10000000000000::NUMERIC AND bux_total < 25000000000000::NUMERIC,
        "buxBeginner" = bux_total >= 2500000000000::NUMERIC AND bux_total < 10000000000000::NUMERIC,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "discordId" = user_discord_id;
END;
$function$;

-- Create helper function to sync all users
CREATE OR REPLACE FUNCTION sync_all_user_roles()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT "discordId"
        FROM "User"
        WHERE "discordId" IS NOT NULL
    LOOP
        PERFORM sync_user_roles(user_record."discordId");
    END LOOP;
END;
$function$; 