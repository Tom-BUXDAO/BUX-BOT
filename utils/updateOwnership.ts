import { prisma } from '@/lib/prisma';

export async function updateOwnership(walletAddress: string, userId: string) {
  console.log(`Updating ownership for wallet ${walletAddress} and user ${userId}`);

  try {
    // Get the user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      throw new Error('User Discord ID not found');
    }

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Update NFTs owned by this wallet
      await tx.nFT.updateMany({
        where: {
          ownerWallet: walletAddress,
          ownerDiscordId: null // Only update NFTs that don't have an owner set
        },
        data: {
          ownerDiscordId: user.discordId
        }
      });

      // Update token balances for this wallet
      await tx.tokenBalance.upsert({
        where: {
          walletAddress: walletAddress
        },
        update: {
          ownerDiscordId: user.discordId,
          lastUpdated: new Date()
        },
        create: {
          walletAddress: walletAddress,
          ownerDiscordId: user.discordId,
          balance: BigInt(0),
          lastUpdated: new Date()
        }
      });
    });

    // Log the update for monitoring
    console.log(`Successfully updated ownership for wallet ${walletAddress} to Discord ID ${user.discordId}`);

    return true;
  } catch (error) {
    console.error('Error updating ownership:', error);
    throw error;
  }
} 