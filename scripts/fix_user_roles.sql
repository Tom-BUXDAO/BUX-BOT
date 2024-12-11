-- Function to fix roles for a specific user
CREATE OR REPLACE FUNCTION fix_user_roles(target_discord_id TEXT) 
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
    bux_total NUMERIC;
    nft_counts RECORD;
BEGIN
    -- Log start
    RAISE NOTICE 'Fixing roles for user %', target_discord_id;

    -- Get total BUX balance
    SELECT COALESCE(SUM(balance), 0)::NUMERIC INTO bux_total
    FROM "TokenBalance"
    WHERE "ownerDiscordId" = target_discord_id;
    
    -- Get NFT counts with proper collection names
    WITH nft_summary AS (
        SELECT 
            collection,
            COUNT(*) as count
        FROM "NFT"
        WHERE "ownerDiscordId" = target_discord_id
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

    -- Delete existing role entry if exists
    DELETE FROM "Roles" WHERE "discordId" = target_discord_id;

    -- Insert fresh role entry with correct flags
    INSERT INTO "Roles" ("discordId", "discordName")
    VALUES (target_discord_id, target_discord_id)
    ON CONFLICT ("discordId") DO UPDATE
    SET 
        "aiBitbotsHolder" = nft_counts.ai_bitbots_count > 0,
        "fckedCatzHolder" = nft_counts.fcked_catz_count > 0,
        "moneyMonstersHolder" = nft_counts.money_monsters_count > 0,
        "moneyMonsters3dHolder" = nft_counts.money_monsters3d_count > 0,
        "celebCatzHolder" = nft_counts.celebcatz_count > 0,
        "candyBotsHolder" = nft_counts.candy_bots_count > 0,
        "doodleBotsHolder" = nft_counts.doodle_bot_count > 0,
        "energyApesHolder" = nft_counts.energy_apes_count > 0,
        "rjctdBotsHolder" = nft_counts.rjctd_bots_count > 0,
        "squirrelsHolder" = nft_counts.squirrels_count > 0,
        "warriorsHolder" = nft_counts.warriors_count > 0,
        "aiBitbotsWhale" = nft_counts.ai_bitbots_count >= 10,
        "fckedCatzWhale" = nft_counts.fcked_catz_count >= 25,
        "moneyMonstersWhale" = nft_counts.money_monsters_count >= 25,
        "moneyMonsters3dWhale" = nft_counts.money_monsters3d_count >= 25,
        "buxBanker" = bux_total >= 50000000000000::NUMERIC,
        "buxSaver" = bux_total >= 25000000000000::NUMERIC AND bux_total < 50000000000000::NUMERIC,
        "buxBuilder" = bux_total >= 10000000000000::NUMERIC AND bux_total < 25000000000000::NUMERIC,
        "buxBeginner" = bux_total >= 2500000000000::NUMERIC AND bux_total < 10000000000000::NUMERIC,
        "updatedAt" = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Role fix completed for %', target_discord_id;
END;
$$;

-- Run fix for your Discord ID
SELECT fix_user_roles('931160720261939230'); 