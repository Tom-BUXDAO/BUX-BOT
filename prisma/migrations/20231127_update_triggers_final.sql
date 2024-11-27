-- Drop existing triggers
DROP TRIGGER IF EXISTS nft_owner_sync ON "NFT";
DROP TRIGGER IF EXISTS token_balance_sync ON "TokenBalance";
DROP TRIGGER IF EXISTS user_wallet_sync ON "UserWallet";

-- Update trigger function
CREATE OR REPLACE FUNCTION sync_owner_discord_id()
RETURNS TRIGGER AS $$
BEGIN
    -- When a UserWallet is created/updated
    IF TG_TABLE_NAME = 'UserWallet' THEN
        -- Get the discord ID from the User table
        WITH user_data AS (
            SELECT u."discordId"
            FROM "User" u
            WHERE u."id" = NEW."userId"
        )
        -- Update TokenBalance and NFT tables
        UPDATE "TokenBalance" t
        SET "ownerDiscordId" = (SELECT "discordId" FROM user_data)
        WHERE t."walletAddress" = NEW."address";

        UPDATE "NFT" n
        SET "ownerDiscordId" = (SELECT "discordId" FROM user_data)
        WHERE n."ownerWallet" = NEW."address";
    END IF;

    -- When an NFT's owner changes
    IF TG_TABLE_NAME = 'NFT' THEN
        NEW."ownerDiscordId" = (
            SELECT u."discordId"
            FROM "User" u
            JOIN "UserWallet" w ON w."userId" = u."id"
            WHERE w."address" = NEW."ownerWallet"
            LIMIT 1
        );
    END IF;

    -- When a TokenBalance changes
    IF TG_TABLE_NAME = 'TokenBalance' THEN
        NEW."ownerDiscordId" = (
            SELECT u."discordId"
            FROM "User" u
            JOIN "UserWallet" w ON w."userId" = u."id"
            WHERE w."address" = NEW."walletAddress"
            LIMIT 1
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER user_wallet_sync
    AFTER INSERT OR UPDATE OF "address" ON "UserWallet"
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_discord_id();

CREATE TRIGGER nft_owner_sync
    BEFORE INSERT OR UPDATE OF "ownerWallet" ON "NFT"
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_discord_id();

CREATE TRIGGER token_balance_sync
    BEFORE INSERT OR UPDATE OF "walletAddress" ON "TokenBalance"
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_discord_id(); 