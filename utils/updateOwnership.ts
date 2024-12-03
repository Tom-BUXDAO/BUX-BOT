import { prisma } from '@/lib/prisma';

export async function updateOwnership(walletAddress: string, userId: string) {
  console.log(`Starting ownership update for wallet ${walletAddress} and user ${userId}`);

  try {
    // Get the user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        discordId: true,
        discordName: true
      }
    });

    if (!user?.discordId) {
      throw new Error('User Discord ID not found');
    }

    console.log(`Found user:`, user);

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First get all NFTs for this wallet
      const nfts = await tx.nFT.findMany({
        where: {
          ownerWallet: walletAddress
        }
      });
      console.log(`Found ${nfts.length} NFTs for wallet ${walletAddress}`);

      if (nfts.length > 0) {
        // Update NFTs owned by this wallet
        const nftResult = await tx.nFT.updateMany({
          where: {
            ownerWallet: walletAddress
          },
          data: {
            ownerDiscordId: user.discordId
          }
        });
        console.log(`Updated ${nftResult.count} NFTs with Discord ID ${user.discordId}`);
      }

      // Get current token balance
      const tokenBalance = await tx.tokenBalance.findUnique({
        where: { walletAddress: walletAddress }
      });
      console.log('Found token balance:', tokenBalance);

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
          balance: tokenBalance?.balance || BigInt(0),
          lastUpdated: new Date()
        }
      });
      console.log('Updated token balance:', tokenResult);
    });

    console.log(`Successfully completed ownership update for wallet ${walletAddress}`);
    return true;
  } catch (error) {
    console.error('Error updating ownership:', error);
    throw error;
  }
} 