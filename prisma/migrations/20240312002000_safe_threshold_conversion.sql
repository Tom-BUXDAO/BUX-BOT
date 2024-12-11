-- First backup the existing values
CREATE TABLE IF NOT EXISTS "RoleConfig_backup" AS 
SELECT * FROM "RoleConfig";

-- Update the column type safely
ALTER TABLE "RoleConfig" 
ALTER COLUMN threshold TYPE INTEGER 
USING CASE 
    WHEN threshold > 2147483647 THEN 2147483647  -- Max INTEGER value
    ELSE threshold::INTEGER 
END;

-- Add a comment explaining the conversion
COMMENT ON COLUMN "RoleConfig".threshold IS 'Converted from BIGINT to INTEGER with max value capping'; 