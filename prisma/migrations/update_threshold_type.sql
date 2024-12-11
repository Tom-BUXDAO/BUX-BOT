-- Convert threshold column to BIGINT
ALTER TABLE "RoleConfig" 
ALTER COLUMN threshold TYPE BIGINT 
USING CASE 
  WHEN threshold IS NULL THEN NULL 
  ELSE threshold::BIGINT 
END; 