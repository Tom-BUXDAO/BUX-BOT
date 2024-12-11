-- Add buxDao5 column if it doesn't exist
ALTER TABLE "Roles" 
ADD COLUMN IF NOT EXISTS "buxDao5" BOOLEAN DEFAULT false;

-- Create function to check main collection holdings
CREATE OR REPLACE FUNCTION check_main_collections(user_discord_id TEXT) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_all_collections BOOLEAN;
BEGIN
    SELECT 
        bool_and(count > 0) INTO has_all_collections
    FROM (
        SELECT collection, COUNT(*) as count
        FROM "NFT"
        WHERE "ownerDiscordId" = user_discord_id
        AND collection IN (
            'ai_bitbots',
            'fcked_catz',
            'money_monsters',
            'money_monsters3d',
            'celebcatz'
        )
        GROUP BY collection
    ) counts;
    
    RETURN COALESCE(has_all_collections, false);
END;
$$;

-- Create trigger function to update buxDao5
CREATE OR REPLACE FUNCTION update_buxdao5() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "Roles"
    SET "buxDao5" = check_main_collections(NEW."ownerDiscordId")
    WHERE "discordId" = NEW."ownerDiscordId";
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_buxdao5_trigger
AFTER INSERT OR UPDATE OF "ownerDiscordId" ON "NFT"
FOR EACH ROW
EXECUTE FUNCTION update_buxdao5(); 