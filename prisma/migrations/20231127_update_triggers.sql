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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 