import { PrismaClient } from '@prisma/client';
import { exit } from 'process';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

interface SyncStats {
  totalWallets: number;
  updatedTokenBalances: number;
  updatedNFTs: number;
  errors: string[];
}

async function syncOwnerDiscordIds(dryRun: boolean = true) {
  const stats: SyncStats = {
    totalWallets: 0,
    updatedTokenBalances: 0,
    updatedNFTs: 0,
    errors: []
  };

  try {
    console.log(`Starting Discord ID sync in ${dryRun ? 'DRY RUN' : 'LIVE'} mode...`);

    // Get all UserWallet records with their associated User
    const userWallets = await prisma.userWallet.findMany({
      include: {
        user: {
          select: {
            discordId: true,
            discordName: true
          }
        }
      }
    });

    console.log(`Found ${userWallets.length} wallet associations`);

    // Process each wallet
    for (const userWallet of userWallets) {
      console.log(`\nProcessing wallet ${userWallet.address} for user ${userWallet.user.discordName}`);
      stats.totalWallets++;

      try {
        // First check what would be updated
        const tokenBalanceCount = await prisma.tokenBalance.count({
          where: {
            walletAddress: userWallet.address,
            ownerDiscordId: null
          }
        });

        const nftCount = await prisma.nFT.count({
          where: {
            ownerWallet: userWallet.address,
            ownerDiscordId: null
          }
        });

        console.log(`Found ${tokenBalanceCount} token balances and ${nftCount} NFTs to update`);

        if (!dryRun) {
          // Perform updates in transaction
          await prisma.$transaction(async (tx) => {
            if (tokenBalanceCount > 0) {
              await tx.tokenBalance.updateMany({
                where: {
                  walletAddress: userWallet.address,
                  ownerDiscordId: null
                },
                data: {
                  ownerDiscordId: userWallet.user.discordId
                }
              });
              stats.updatedTokenBalances += tokenBalanceCount;
            }

            if (nftCount > 0) {
              await tx.nFT.updateMany({
                where: {
                  ownerWallet: userWallet.address,
                  ownerDiscordId: null
                },
                data: {
                  ownerDiscordId: userWallet.user.discordId
                }
              });
              stats.updatedNFTs += nftCount;
            }
          });

          console.log(`Updated ${tokenBalanceCount} token balances and ${nftCount} NFTs`);
        }

      } catch (error) {
        const errorMsg = `Error processing wallet ${userWallet.address}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    console.log('\n=== Sync Summary ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Total wallets processed: ${stats.totalWallets}`);
    if (!dryRun) {
      console.log(`Token balances updated: ${stats.updatedTokenBalances}`);
      console.log(`NFTs updated: ${stats.updatedNFTs}`);
    }
    if (stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      stats.errors.forEach((err: string) => console.log(`- ${err}`));
    }

  } catch (error) {
    console.error('Fatal error during sync:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const live = args.includes('--live');

if (live) {
  console.log('\n⚠️  WARNING: Running in LIVE mode - database will be updated!\n');
  console.log('You have 5 seconds to cancel (Ctrl+C)...');
  setTimeout(() => {
    syncOwnerDiscordIds(false)
      .catch(console.error)
      .finally(() => exit());
  }, 5000);
} else {
  console.log('\nRunning in DRY RUN mode (no changes will be made)');
  console.log('To run in live mode, use: npm run sync-discord-ids -- --live\n');
  syncOwnerDiscordIds(true)
    .catch(console.error)
    .finally(() => exit());
} 