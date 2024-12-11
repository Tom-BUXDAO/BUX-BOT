-- First backup the table
CREATE TABLE IF NOT EXISTS "RoleConfig_backup" AS 
SELECT * FROM "RoleConfig";

-- Alter column type (values are already correct)
ALTER TABLE "RoleConfig"
ALTER COLUMN threshold TYPE INTEGER
USING threshold::INTEGER;

-- Add comment explaining thresholds
COMMENT ON COLUMN "RoleConfig".threshold IS 'NFT roles: 1 for holders, 10-25 for whales. BUX roles: thousands (2500-50000). Special roles: 0.'; 