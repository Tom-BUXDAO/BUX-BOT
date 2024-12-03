import { prisma } from '@/lib/prisma';

export async function updateOwnership(walletAddress: string, userId: string) {
  console.log(`Starting ownership update for wallet ${walletAddress} and user ${userId}`);

  try {
    // Get the user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      throw new Error('User Discord ID not found');
    }

    console.log(`Found Discord ID: ${user.discordId}`);

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First check if NFTs exist for this wallet
      const nftsCount = await tx.nFT.count({
        where: {
          ownerWallet: walletAddress
        }
      });
      console.log(`Found ${nftsCount} NFTs for wallet ${walletAddress}`);

      // Update NFTs owned by this wallet
      const nftResult = await tx.nFT.updateMany({
        where: {
          ownerWallet: walletAddress
        },
        data: {
          ownerDiscordId: user.discordId
        }
      });
      console.log(`Updated ${nftResult.count} NFTs with Discord ID`);

      // Check existing token balance
      const existingBalance = await tx.tokenBalance.findUnique({
        where: { walletAddress: walletAddress }
      });
      console.log(`Current token balance: ${existingBalance ? Number(existingBalance.balance) / 1_000_000_000 : 0} BUX`);

      // Update or create token balance record
      const tokenResult = await tx.tokenBalance.upsert({
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
          balance: existingBalance?.balance || BigInt(0),
          lastUpdated: new Date()
        }
      });
      console.log(`Updated token balance record with Discord ID`);
    });

    console.log(`Successfully completed ownership update for wallet ${walletAddress}`);
    return true;
  } catch (error) {
    console.error('Error updating ownership:', error);
    throw error;
  }
} 