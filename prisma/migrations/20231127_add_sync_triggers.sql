-- Create function to sync owner discord IDs
CREATE OR REPLACE FUNCTION sync_owner_discord_id()
RETURNS TRIGGER AS $$
BEGIN
    -- When a User's wallet address is updated
    IF TG_TABLE_NAME = 'User' THEN
        -- Update TokenBalance table
        UPDATE "TokenBalance"
        SET "ownerDiscordId" = NEW."discordId"
        WHERE "walletAddress" = NEW."walletAddress";

        -- Update NFT table
        UPDATE "NFT"
        SET "ownerDiscordId" = NEW."discordId"
        WHERE "ownerWallet" = NEW."walletAddress";
    END IF;

    -- When a TokenBalance record is created/updated
    IF TG_TABLE_NAME = 'TokenBalance' THEN
        UPDATE "TokenBalance"
        SET "ownerDiscordId" = (
            SELECT "discordId" 
            FROM "User" 
            WHERE "walletAddress" = NEW."walletAddress"
            LIMIT 1
        )
        WHERE "id" = NEW."id";
    END IF;

    -- When an NFT record is created/updated
    IF TG_TABLE_NAME = 'NFT' THEN
        UPDATE "NFT"
        SET "ownerDiscordId" = (
            SELECT "discordId" 
            FROM "User" 
            WHERE "walletAddress" = NEW."ownerWallet"
            LIMIT 1
        )
        WHERE "id" = NEW."id";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS user_wallet_change ON "User";
DROP TRIGGER IF EXISTS token_balance_sync ON "TokenBalance";
DROP TRIGGER IF EXISTS nft_owner_sync ON "NFT";

-- Create triggers
CREATE TRIGGER user_wallet_change
    AFTER INSERT OR UPDATE OF "walletAddress" ON "User"
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