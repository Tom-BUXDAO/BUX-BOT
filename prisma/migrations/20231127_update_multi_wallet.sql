-- Create function to sync owner discord IDs
CREATE OR REPLACE FUNCTION sync_owner_discord_id()
RETURNS TRIGGER AS $$
BEGIN
    -- When a UserWallet is created/updated
    IF TG_TABLE_NAME = 'UserWallet' THEN
        -- Get the discord ID from the User table
        DECLARE
            user_discord_id text;
        BEGIN
            SELECT "discordId" INTO user_discord_id
            FROM "User"
            WHERE "id" = NEW."userId"
            LIMIT 1;

            -- Update TokenBalance table
            UPDATE "TokenBalance"
            SET "ownerDiscordId" = user_discord_id
            WHERE "walletAddress" = NEW."address";

            -- Update NFT table
            UPDATE "NFT"
            SET "ownerDiscordId" = user_discord_id
            WHERE "ownerWallet" = NEW."address";
        END;
    END IF;

    -- When a TokenBalance record is created/updated
    IF TG_TABLE_NAME = 'TokenBalance' THEN
        UPDATE "TokenBalance"
        SET "ownerDiscordId" = (
            SELECT u."discordId"
            FROM "User" u
            JOIN "UserWallet" w ON w."userId" = u."id"
            WHERE w."address" = NEW."walletAddress"
            LIMIT 1
        )
        WHERE "id" = NEW."id";
    END IF;

    -- When an NFT record is created/updated
    IF TG_TABLE_NAME = 'NFT' THEN
        UPDATE "NFT"
        SET "ownerDiscordId" = (
            SELECT u."discordId"
            FROM "User" u
            JOIN "UserWallet" w ON w."userId" = u."id"
            WHERE w."address" = NEW."ownerWallet"
            LIMIT 1
        )
        WHERE "id" = NEW."id";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS user_wallet_change ON "UserWallet";
DROP TRIGGER IF EXISTS token_balance_sync ON "TokenBalance";
DROP TRIGGER IF EXISTS nft_owner_sync ON "NFT";

-- Create new triggers
CREATE TRIGGER user_wallet_change
    AFTER INSERT OR UPDATE OF "address" ON "UserWallet"
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_discord_id();

CREATE TRIGGER token_balance_sync
    AFTER INSERT OR UPDATE OF "walletAddress" ON "TokenBalance"
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_discord_id();

CREATE TRIGGER nft_owner_sync
    AFTER INSERT OR UPDATE OF "ownerWallet" ON "NFT"
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_discord_id(); 