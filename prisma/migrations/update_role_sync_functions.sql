CREATE OR REPLACE FUNCTION sync_nft_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert into Roles table
    INSERT INTO "Roles" ("discordId", "discordName")
    VALUES (NEW."ownerDiscordId", NEW."ownerDiscordId")
    ON CONFLICT ("discordId") DO UPDATE
    SET
        -- Update holder and whale statuses dynamically
        "aiBitbotsHolder" = EXISTS(
            SELECT 1 FROM "NFT" 
            WHERE collection = 'ai_bitbots' 
            AND "ownerDiscordId" = NEW."ownerDiscordId"
        ),
        "aiBitbotsWhale" = (
            SELECT COUNT(*) >= get_threshold('ai_bitbots_whale')
            FROM "NFT" 
            WHERE collection = 'ai_bitbots' 
            AND "ownerDiscordId" = NEW."ownerDiscordId"
        ),
        -- Continue for other collections...
        "updatedAt" = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_bux_roles()
RETURNS TRIGGER AS $$
DECLARE
    total_balance BIGINT;
BEGIN
    SELECT COALESCE(SUM(balance), 0) INTO total_balance
    FROM "TokenBalance"
    WHERE "ownerDiscordId" = NEW."ownerDiscordId";

    UPDATE "Roles"
    SET
        "buxBanker" = total_balance >= (get_threshold('bux_banker') * 1000000000),
        "buxBuilder" = total_balance >= (get_threshold('bux_builder') * 1000000000),
        "buxSaver" = total_balance >= (get_threshold('bux_saver') * 1000000000),
        "buxBeginner" = total_balance >= (get_threshold('bux_beginner') * 1000000000),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "discordId" = NEW."ownerDiscordId";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 