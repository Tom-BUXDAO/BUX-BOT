import { prisma } from '../lib/prisma';

async function updateNFTOwnership() {
  try {
    // Get all user wallets with their associated Discord IDs
    const userWallets = await prisma.userWallet.findMany({
      include: {
        user: {
          select: {
            discordId: true
          }
        }
      }
    });

    // Update NFTs for each wallet
    for (const wallet of userWallets) {
      console.log(`Updating NFTs for wallet ${wallet.address}`);
      
      await prisma.nFT.updateMany({
        where: {
          ownerWallet: wallet.address,
          ownerDiscordId: null // Only update NFTs that don't have an owner set
        },
        data: {
          ownerDiscordId: wallet.user.discordId
        }
      });

      // Also update token balances
      await prisma.tokenBalance.upsert({
        where: {
          walletAddress: wallet.address
        },
        update: {
          ownerDiscordId: wallet.user.discordId,
          lastUpdated: new Date()
        },
        create: {
          walletAddress: wallet.address,
          ownerDiscordId: wallet.user.discordId,
          balance: BigInt(0),
          lastUpdated: new Date()
        }
      });
    }

    console.log('NFT ownership update completed');
  } catch (error) {
    console.error('Error updating NFT ownership:', error);
    throw error;
  }
}

// Run the update
updateNFTOwnership()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 