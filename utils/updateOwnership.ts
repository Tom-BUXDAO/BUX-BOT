import { prisma } from '@/lib/prisma';

export async function updateOwnership(walletAddress: string, discordId: string) {
  try {
    console.log(`Updating ownership records for wallet ${walletAddress} with Discord ID ${discordId}`);

    await prisma.$transaction(async (tx) => {
      // Update NFT ownership
      const nftUpdateResult = await tx.nFT.updateMany({
        where: {
          ownerWallet: walletAddress,
          ownerDiscordId: null // Only update unassigned NFTs
        },
        data: {
          ownerDiscordId: discordId
        }
      });

      // Update token balance ownership
      const tokenUpdateResult = await tx.tokenBalance.updateMany({
        where: {
          walletAddress: walletAddress,
          ownerDiscordId: null // Only update unassigned balances
        },
        data: {
          ownerDiscordId: discordId
        }
      });

      console.log(`Updated ${nftUpdateResult.count} NFTs and ${tokenUpdateResult.count} token balances`);
    });

    return true;
  } catch (error) {
    console.error('Error updating ownership records:', error);
    return false;
  }
} 