-- First check if we need to do anything
DO $$
DECLARE
    has_wallet_column boolean;
BEGIN
    -- Check if walletAddress column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'walletAddress'
    ) INTO has_wallet_column;

    -- Only proceed with migration if the column exists
    IF has_wallet_column THEN
        -- Create UserWallet table if it doesn't exist
        CREATE TABLE IF NOT EXISTS "UserWallet" (
            "id" TEXT NOT NULL,
            "address" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
        );

        -- Create unique constraint on address if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'UserWallet_address_key'
        ) THEN
            ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_address_key" UNIQUE ("address");
        END IF;

        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'UserWallet_userId_fkey'
        ) THEN
            ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;

        -- Migrate existing wallet addresses from User table to UserWallet
        INSERT INTO "UserWallet" ("id", "address", "userId", "createdAt", "updatedAt")
        SELECT 
            gen_random_uuid()::text,
            "walletAddress",
            "id",
            "createdAt",
            CURRENT_TIMESTAMP
        FROM "User"
        WHERE "walletAddress" IS NOT NULL
        ON CONFLICT DO NOTHING;

        -- Drop the trigger first
        DROP TRIGGER IF EXISTS user_wallet_change ON "User";
        -- Then drop the column
        ALTER TABLE "User" DROP COLUMN "walletAddress";
    END IF;
END $$; 