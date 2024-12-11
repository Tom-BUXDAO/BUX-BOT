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
    nft_counts RECORD;
    user_name TEXT;
BEGIN
    -- Get user's Discord name
    SELECT "discordName" INTO user_name
    FROM "Roles"
    WHERE "discordId" = user_discord_id;

    -- Get total BUX balance
    SELECT COALESCE(SUM(balance), 0)::NUMERIC INTO bux_total
    FROM "TokenBalance"
    WHERE "ownerDiscordId" = user_discord_id;
    
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

    -- Insert or update roles
    INSERT INTO "Roles" (
        "discordId",
        "discordName",
        "aiBitbotsHolder",
        "fckedCatzHolder",
        "moneyMonstersHolder",
        "moneyMonsters3dHolder",
        "celebCatzHolder",
        "candyBotsHolder",
        "doodleBotsHolder",
        "energyApesHolder",
        "rjctdBotsHolder",
        "squirrelsHolder",
        "warriorsHolder",
        "aiBitbotsWhale",
        "fckedCatzWhale",
        "moneyMonstersWhale",
        "moneyMonsters3dWhale",
        "buxBanker",
        "buxSaver",
        "buxBuilder",
        "buxBeginner",
        "updatedAt"
    )
    VALUES (
        user_discord_id,
        COALESCE(user_name, user_discord_id),
        nft_counts.ai_bitbots_count > 0,
        nft_counts.fcked_catz_count > 0,
        nft_counts.money_monsters_count > 0,
        nft_counts.money_monsters3d_count > 0,
        nft_counts.celebcatz_count > 0,
        nft_counts.candy_bots_count > 0,
        nft_counts.doodle_bot_count > 0,
        nft_counts.energy_apes_count > 0,
        nft_counts.rjctd_bots_count > 0,
        nft_counts.squirrels_count > 0,
        nft_counts.warriors_count > 0,
        nft_counts.ai_bitbots_count >= 10,
        nft_counts.fcked_catz_count >= 25,
        nft_counts.money_monsters_count >= 25,
        nft_counts.money_monsters3d_count >= 25,
        bux_total >= 50000000000000::NUMERIC,
        bux_total >= 25000000000000::NUMERIC AND bux_total < 50000000000000::NUMERIC,
        bux_total >= 10000000000000::NUMERIC AND bux_total < 25000000000000::NUMERIC,
        bux_total >= 2500000000000::NUMERIC AND bux_total < 10000000000000::NUMERIC,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("discordId") DO UPDATE
    SET 
        "aiBitbotsHolder" = EXCLUDED."aiBitbotsHolder",
        "fckedCatzHolder" = EXCLUDED."fckedCatzHolder",
        "moneyMonstersHolder" = EXCLUDED."moneyMonstersHolder",
        "moneyMonsters3dHolder" = EXCLUDED."moneyMonsters3dHolder",
        "celebCatzHolder" = EXCLUDED."celebCatzHolder",
        "candyBotsHolder" = EXCLUDED."candyBotsHolder",
        "doodleBotsHolder" = EXCLUDED."doodleBotsHolder",
        "energyApesHolder" = EXCLUDED."energyApesHolder",
        "rjctdBotsHolder" = EXCLUDED."rjctdBotsHolder",
        "squirrelsHolder" = EXCLUDED."squirrelsHolder",
        "warriorsHolder" = EXCLUDED."warriorsHolder",
        "aiBitbotsWhale" = EXCLUDED."aiBitbotsWhale",
        "fckedCatzWhale" = EXCLUDED."fckedCatzWhale",
        "moneyMonstersWhale" = EXCLUDED."moneyMonstersWhale",
        "moneyMonsters3dWhale" = EXCLUDED."moneyMonsters3dWhale",
        "buxBanker" = EXCLUDED."buxBanker",
        "buxSaver" = EXCLUDED."buxSaver",
        "buxBuilder" = EXCLUDED."buxBuilder",
        "buxBeginner" = EXCLUDED."buxBeginner",
        "updatedAt" = CURRENT_TIMESTAMP;
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