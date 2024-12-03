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
      const nftResult = await tx.nFT.updateMany({
        where: {
          ownerWallet: walletAddress
        },
        data: {
          ownerDiscordId: user.discordId
        }
      });
      console.log(`Updated ${nftResult.count} NFTs for wallet ${walletAddress}`);

      // Get current token balance
      const tokenBalance = await tx.tokenBalance.findUnique({
        where: { walletAddress: walletAddress }
      });

      // Update or create token balance record
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
          balance: tokenBalance?.balance || BigInt(0),
          lastUpdated: new Date()
        }
      });
      console.log(`Updated token balance for wallet ${walletAddress}`);
    });

    console.log(`Successfully updated ownership for wallet ${walletAddress} to Discord ID ${user.discordId}`);
    return true;
  } catch (error) {
    console.error('Error updating ownership:', error);
    throw error;
  }
} 