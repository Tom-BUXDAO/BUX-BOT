import { prisma } from '../lib/prisma';

const DISCORD_ID_TO_CLEAR = '931160720261939230'; // your Discord ID

async function clearTestUser() {
  try {
    console.log('Starting cleanup...');

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Clear NFT ownership
      const nftResult = await tx.nFT.updateMany({
        where: {
          ownerDiscordId: DISCORD_ID_TO_CLEAR
        },
        data: {
          ownerDiscordId: null
        }
      });
      console.log(`Cleared ownership from ${nftResult.count} NFTs`);

      // Clear token balances
      const tokenResult = await tx.tokenBalance.deleteMany({
        where: {
          ownerDiscordId: DISCORD_ID_TO_CLEAR
        }
      });
      console.log(`Removed ${tokenResult.count} token balance records`);

      // Remove wallet connections
      const walletResult = await tx.userWallet.deleteMany({
        where: {
          user: {
            discordId: DISCORD_ID_TO_CLEAR
          }
        }
      });
      console.log(`Removed ${walletResult.count} wallet connections`);

      // Remove user
      const userResult = await tx.user.delete({
        where: {
          discordId: DISCORD_ID_TO_CLEAR
        }
      });
      console.log(`Removed user: ${userResult.discordName}`);
    });

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
clearTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 