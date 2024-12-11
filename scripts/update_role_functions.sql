-- Drop existing triggers and functions with CASCADE
DROP TRIGGER IF EXISTS nft_role_sync ON "NFT";
DROP TRIGGER IF EXISTS bux_role_sync ON "TokenBalance";
DROP FUNCTION IF EXISTS sync_user_roles(TEXT) CASCADE;
DROP FUNCTION IF EXISTS sync_nft_roles() CASCADE;
DROP FUNCTION IF EXISTS sync_bux_roles() CASCADE;

-- Create the main sync function
CREATE OR REPLACE FUNCTION sync_user_roles(user_discord_id TEXT) 
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
    bux_total NUMERIC;
    user_name TEXT;
    nft_counts RECORD;
BEGIN
    -- Log start of sync
    RAISE NOTICE 'Starting role sync for user %', user_discord_id;

    -- Skip if discord ID is null
    IF user_discord_id IS NULL THEN
        RAISE NOTICE 'Skipping sync - null discord ID';
        RETURN;
    END IF;

    -- Get total BUX balance
    SELECT COALESCE(SUM(balance), 0)::NUMERIC INTO bux_total
    FROM "TokenBalance"
    WHERE "ownerDiscordId" = user_discord_id;
    
    RAISE NOTICE 'BUX balance for %: %', user_discord_id, bux_total;

    -- Get NFT counts
    WITH nft_summary AS (
        SELECT 
            collection,
            COUNT(*) as count
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

    RAISE NOTICE 'NFT counts for %: %', user_discord_id, nft_counts;

    -- Update roles
    INSERT INTO "Roles" ("discordId", "discordName")
    VALUES (user_discord_id, COALESCE(user_name, user_discord_id))
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

    RAISE NOTICE 'Role sync completed for %', user_discord_id;
END;
$$;

-- Update triggers to handle NULL discord IDs
CREATE OR REPLACE FUNCTION sync_nft_roles() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."ownerDiscordId" IS NOT NULL THEN
        PERFORM sync_user_roles(NEW."ownerDiscordId");
    END IF;
    IF OLD."ownerDiscordId" IS NOT NULL AND OLD."ownerDiscordId" != NEW."ownerDiscordId" THEN
        PERFORM sync_user_roles(OLD."ownerDiscordId");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_bux_roles() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."ownerDiscordId" IS NOT NULL THEN
        PERFORM sync_user_roles(NEW."ownerDiscordId");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
DROP TRIGGER IF EXISTS nft_role_sync ON "NFT";
DROP TRIGGER IF EXISTS bux_role_sync ON "TokenBalance";

CREATE TRIGGER nft_role_sync
AFTER INSERT OR UPDATE OF "ownerDiscordId" ON "NFT"
FOR EACH ROW
EXECUTE FUNCTION sync_nft_roles();

CREATE TRIGGER bux_role_sync
AFTER INSERT OR UPDATE OF balance, "ownerDiscordId" ON "TokenBalance"
FOR EACH ROW
EXECUTE FUNCTION sync_bux_roles(); 