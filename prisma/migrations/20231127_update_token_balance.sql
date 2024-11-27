-- First backup the existing data
CREATE TABLE "TokenBalance_backup" AS 
SELECT * FROM "TokenBalance";

-- Drop constraints on TokenBalance
ALTER TABLE "TokenBalance" DROP CONSTRAINT IF EXISTS "TokenBalance_pkey";

-- Update TokenBalance table structure
ALTER TABLE "TokenBalance" 
    DROP COLUMN IF EXISTS "id",
    DROP COLUMN IF EXISTS "createdAt",
    ALTER COLUMN "balance" TYPE BIGINT USING (balance::bigint),
    ADD PRIMARY KEY ("walletAddress");

-- Verify data
DO $$
DECLARE
    original_count integer;
    new_count integer;
BEGIN
    SELECT COUNT(*) INTO original_count FROM "TokenBalance_backup";
    SELECT COUNT(*) INTO new_count FROM "TokenBalance";
    
    IF original_count != new_count THEN
        RAISE EXCEPTION 'Data loss detected! Original count: %, New count: %', original_count, new_count;
    END IF;
END $$; 