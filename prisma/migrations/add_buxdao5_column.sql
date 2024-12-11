-- Safely add column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Roles' 
        AND column_name = 'buxDao5'
    ) THEN
        ALTER TABLE "Roles" 
        ADD COLUMN "buxDao5" BOOLEAN DEFAULT false;
    END IF;
END $$; 