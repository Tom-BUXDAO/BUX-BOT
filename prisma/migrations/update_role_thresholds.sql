-- Convert threshold column to BIGINT
ALTER TABLE "RoleConfig" 
ALTER COLUMN threshold TYPE BIGINT 
USING threshold::BIGINT; 