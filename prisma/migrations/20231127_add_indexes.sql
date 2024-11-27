-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS "idx_user_discord_id" ON "User"("discordId");
CREATE INDEX IF NOT EXISTS "idx_user_wallet_address" ON "UserWallet"("address");
CREATE INDEX IF NOT EXISTS "idx_nft_owner_wallet" ON "NFT"("ownerWallet");
CREATE INDEX IF NOT EXISTS "idx_token_balance_wallet" ON "TokenBalance"("walletAddress");

-- Add composite index for wallet lookups
CREATE INDEX IF NOT EXISTS "idx_user_wallet_lookup" 
ON "UserWallet"("address", "userId"); 