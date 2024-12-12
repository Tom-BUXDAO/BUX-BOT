-- Add RoleSync table without dropping anything
CREATE TABLE IF NOT EXISTS "RoleSync" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "added" TEXT[],
    "removed" TEXT[],
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleSync_pkey" PRIMARY KEY ("id")
);

-- Add indices if they don't exist
CREATE INDEX IF NOT EXISTS "RoleSync_discordId_idx" ON "RoleSync"("discordId");
CREATE INDEX IF NOT EXISTS "RoleSync_timestamp_idx" ON "RoleSync"("timestamp");

-- Create or replace the calculate_role_changes function with all role mappings
CREATE OR REPLACE FUNCTION calculate_role_changes(user_discord_id text)
RETURNS TABLE (
    added text[],
    removed text[],
    previousRoles text[],
    newRoles text[]
) AS $$
DECLARE
    current_roles text[];
    qualifying_roles text[];
BEGIN
    -- Get current Discord roles
    SELECT array_agg(r.roleId)
    INTO current_roles
    FROM "RoleConfig" r
    JOIN "Roles" ur ON (
        -- NFT Holder roles
        (r.roleName = 'ai_bitbots_holder' AND ur.aiBitbotsHolder = true) OR
        (r.roleName = 'fcked_catz_holder' AND ur.fckedCatzHolder = true) OR
        (r.roleName = 'money_monsters_holder' AND ur.moneyMonstersHolder = true) OR
        (r.roleName = 'money_monsters3d_holder' AND ur.moneyMonsters3dHolder = true) OR
        (r.roleName = 'celebcatz_holder' AND ur.celebCatzHolder = true) OR
        (r.roleName = 'candy_bots_holder' AND ur.candyBotsHolder = true) OR
        (r.roleName = 'doodle_bots_holder' AND ur.doodleBotsHolder = true) OR
        (r.roleName = 'energy_apes_holder' AND ur.energyApesHolder = true) OR
        (r.roleName = 'rjctd_bots_holder' AND ur.rjctdBotsHolder = true) OR
        (r.roleName = 'squirrels_holder' AND ur.squirrelsHolder = true) OR
        (r.roleName = 'warriors_holder' AND ur.warriorsHolder = true) OR
        
        -- Whale roles
        (r.roleName = 'ai_bitbots_whale' AND ur.aiBitbotsWhale = true) OR
        (r.roleName = 'fcked_catz_whale' AND ur.fckedCatzWhale = true) OR
        (r.roleName = 'money_monsters_whale' AND ur.moneyMonstersWhale = true) OR
        (r.roleName = 'money_monsters3d_whale' AND ur.moneyMonsters3dWhale = true) OR
        
        -- BUX Token roles
        (r.roleName = 'bux_banker' AND ur.buxBanker = true) OR
        (r.roleName = 'bux_saver' AND ur.buxSaver = true) OR
        (r.roleName = 'bux_builder' AND ur.buxBuilder = true) OR
        (r.roleName = 'bux_beginner' AND ur.buxBeginner = true) OR
        
        -- Special roles
        (r.roleName = 'bux_dao_5' AND ur.buxDao5 = true) OR
        (r.roleName = 'mm_top_10' AND ur.mmTop10 = true) OR
        (r.roleName = 'mm3d_top_10' AND ur.mm3dTop10 = true)
    )
    WHERE ur.discordId = user_discord_id;

    -- Calculate qualifying roles
    PERFORM sync_user_roles(user_discord_id);
    
    SELECT array_agg(rc.roleId)
    INTO qualifying_roles
    FROM "RoleConfig" rc
    JOIN "Roles" r ON r.discordId = user_discord_id
    WHERE (
        -- NFT Holder roles
        (rc.roleName = 'ai_bitbots_holder' AND r.aiBitbotsHolder = true) OR
        (rc.roleName = 'fcked_catz_holder' AND r.fckedCatzHolder = true) OR
        (rc.roleName = 'money_monsters_holder' AND r.moneyMonstersHolder = true) OR
        (rc.roleName = 'money_monsters3d_holder' AND r.moneyMonsters3dHolder = true) OR
        (rc.roleName = 'celebcatz_holder' AND r.celebCatzHolder = true) OR
        (rc.roleName = 'candy_bots_holder' AND r.candyBotsHolder = true) OR
        (rc.roleName = 'doodle_bots_holder' AND r.doodleBotsHolder = true) OR
        (rc.roleName = 'energy_apes_holder' AND r.energyApesHolder = true) OR
        (rc.roleName = 'rjctd_bots_holder' AND r.rjctdBotsHolder = true) OR
        (rc.roleName = 'squirrels_holder' AND r.squirrelsHolder = true) OR
        (rc.roleName = 'warriors_holder' AND r.warriorsHolder = true) OR
        
        -- Whale roles
        (rc.roleName = 'ai_bitbots_whale' AND r.aiBitbotsWhale = true) OR
        (rc.roleName = 'fcked_catz_whale' AND r.fckedCatzWhale = true) OR
        (rc.roleName = 'money_monsters_whale' AND r.moneyMonstersWhale = true) OR
        (rc.roleName = 'money_monsters3d_whale' AND r.moneyMonsters3dWhale = true) OR
        
        -- BUX Token roles
        (rc.roleName = 'bux_banker' AND r.buxBanker = true) OR
        (rc.roleName = 'bux_saver' AND r.buxSaver = true) OR
        (rc.roleName = 'bux_builder' AND r.buxBuilder = true) OR
        (rc.roleName = 'bux_beginner' AND r.buxBeginner = true) OR
        
        -- Special roles
        (rc.roleName = 'bux_dao_5' AND r.buxDao5 = true) OR
        (rc.roleName = 'mm_top_10' AND r.mmTop10 = true) OR
        (rc.roleName = 'mm3d_top_10' AND r.mm3dTop10 = true)
    );

    RETURN QUERY
    SELECT
        ARRAY(
            SELECT UNNEST(qualifying_roles)
            EXCEPT
            SELECT UNNEST(COALESCE(current_roles, ARRAY[]::text[]))
        ) as added,
        ARRAY(
            SELECT UNNEST(COALESCE(current_roles, ARRAY[]::text[]))
            EXCEPT
            SELECT UNNEST(qualifying_roles)
        ) as removed,
        COALESCE(current_roles, ARRAY[]::text[]) as previousRoles,
        qualifying_roles as newRoles;
END;
$$ LANGUAGE plpgsql;

-- Add comment to track migration
COMMENT ON FUNCTION calculate_role_changes(text) IS 'Added in 20240312_add_role_sync_safe migration with complete role mappings';
``` 