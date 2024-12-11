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
    -- Get total BUX balance
    SELECT COALESCE(SUM(balance), 0)::NUMERIC INTO bux_total
    FROM "TokenBalance"
    WHERE "ownerDiscordId" = user_discord_id;

    -- Get username
    SELECT "discordName" INTO user_name
    FROM "User"
    WHERE "discordId" = user_discord_id;

    -- Get NFT counts
    SELECT 
        COUNT(*) FILTER (WHERE collection = 'ai_bitbots') as ai_bitbots_count,
        COUNT(*) FILTER (WHERE collection = 'fcked_catz') as fcked_catz_count,
        COUNT(*) FILTER (WHERE collection = 'money_monsters') as money_monsters_count,
        COUNT(*) FILTER (WHERE collection = 'money_monsters3d') as money_monsters3d_count,
        COUNT(*) FILTER (WHERE collection = 'celebcatz') as celebcatz_count
    INTO nft_counts
    FROM "NFT"
    WHERE "ownerDiscordId" = user_discord_id;

    -- Update roles
    INSERT INTO "Roles" ("discordId", "discordName")
    VALUES (user_discord_id, COALESCE(user_name, user_discord_id))
    ON CONFLICT ("discordId") DO UPDATE
    SET 
        "discordName" = EXCLUDED."discordName",
        "aiBitbotsHolder" = nft_counts.ai_bitbots_count > 0,
        "fckedCatzHolder" = nft_counts.fcked_catz_count > 0,
        "moneyMonstersHolder" = nft_counts.money_monsters_count > 0,
        "moneyMonsters3dHolder" = nft_counts.money_monsters3d_count > 0,
        "celebCatzHolder" = nft_counts.celebcatz_count > 0,
        "buxBanker" = bux_total >= 50000000000000::NUMERIC,
        "buxSaver" = bux_total >= 25000000000000::NUMERIC AND bux_total < 50000000000000::NUMERIC,
        "buxBuilder" = bux_total >= 10000000000000::NUMERIC AND bux_total < 25000000000000::NUMERIC,
        "buxBeginner" = bux_total >= 2500000000000::NUMERIC AND bux_total < 10000000000000::NUMERIC,
        "updatedAt" = CURRENT_TIMESTAMP;
END;
$$;

-- Create triggers
CREATE OR REPLACE FUNCTION sync_nft_roles() 
RETURNS TRIGGER AS $$
BEGIN
    PERFORM sync_user_roles(NEW."ownerDiscordId");
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_bux_roles() 
RETURNS TRIGGER AS $$
BEGIN
    PERFORM sync_user_roles(NEW."ownerDiscordId");
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER nft_role_sync
AFTER INSERT OR UPDATE OF "ownerDiscordId" ON "NFT"
FOR EACH ROW
EXECUTE FUNCTION sync_nft_roles();

CREATE TRIGGER bux_role_sync
AFTER INSERT OR UPDATE OF balance ON "TokenBalance"
FOR EACH ROW
EXECUTE FUNCTION sync_bux_roles(); 