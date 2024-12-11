-- Create a table for role configurations
CREATE TABLE role_config (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    role_id VARCHAR(100) NOT NULL,
    threshold INTEGER,
    collection_name VARCHAR(100),
    role_type VARCHAR(50) NOT NULL, -- 'holder', 'whale', 'bux'
    UNIQUE(role_name)
);

-- Create a function to update roles
CREATE OR REPLACE FUNCTION update_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Update holder roles based on NFT ownership
    UPDATE roles r
    SET 
        aiBitbotsHolder = EXISTS(
            SELECT 1 FROM "NFT" WHERE collection = 'ai_bitbots' AND "ownerDiscordId" = r."discordId"
        ),
        moneyMonstersHolder = EXISTS(
            SELECT 1 FROM "NFT" WHERE collection = 'money_monsters' AND "ownerDiscordId" = r."discordId"
        ),
        -- Add other collections...

        -- Update whale roles
        aiBitbotsWhale = (
            SELECT COUNT(*) >= (SELECT threshold FROM role_config WHERE role_name = 'ai_bitbots_whale')
            FROM "NFT" 
            WHERE collection = 'ai_bitbots' AND "ownerDiscordId" = r."discordId"
        ),
        -- Add other whale roles...

        -- Update BUX roles
        buxBanker = (
            SELECT COALESCE(SUM(balance), 0) >= (SELECT threshold FROM role_config WHERE role_name = 'bux_banker') * 1000000000
            FROM "TokenBalance"
            WHERE "ownerDiscordId" = r."discordId"
        ),
        -- Add other BUX roles...

        updatedAt = NOW()
    WHERE r."discordId" = NEW."ownerDiscordId";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update roles
CREATE TRIGGER update_roles_on_nft_change
AFTER INSERT OR UPDATE OR DELETE ON "NFT"
FOR EACH ROW
EXECUTE FUNCTION update_user_roles();

CREATE TRIGGER update_roles_on_token_change
AFTER INSERT OR UPDATE OR DELETE ON "TokenBalance"
FOR EACH ROW
EXECUTE FUNCTION update_user_roles(); 