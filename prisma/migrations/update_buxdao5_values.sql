-- Update existing records without losing data
UPDATE "Roles" r
SET "buxDao5" = check_main_collections(r."discordId")
WHERE r."discordId" IS NOT NULL; 