import { prisma } from '@/lib/prisma';

export async function verifyHolder(walletAddress: string, discordId: string) {
  try {
    // Get NFTs and balance
    const nfts = await prisma.nFT.findMany({
      where: {
        ownerWallet: walletAddress,
        ownerDiscordId: discordId
      }
    });

    const balance = await prisma.tokenBalance.findUnique({
      where: { 
        walletAddress,
        ownerDiscordId: discordId
      }
    });

    // Return empty array if no holdings
    if (nfts.length === 0 && !balance) {
      return {
        isHolder: false,
        collections: [],
        buxBalance: 0,
        totalNFTs: 0,
        totalValue: 0,
        assignedRoles: []
      };
    }

    // Rest of your role assignment logic...
    const assignedRoles: string[] = [];
    
    return {
      isHolder: true,
      collections: [],
      buxBalance: balance ? Number(balance.balance) / 1_000_000_000 : 0,
      totalNFTs: nfts.length,
      totalValue: 0,
      assignedRoles
    };

  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 