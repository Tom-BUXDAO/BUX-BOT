import { prisma } from '@/lib/prisma';

interface Collection {
  name: string;
  count: number;
}

interface VerificationResult {
  isHolder: boolean;
  collections: Collection[];
  buxBalance: number;
  totalNFTs: number;
  totalValue: number;
  assignedRoles: string[];
}

export async function verifyHolder(walletAddress: string, discordId: string): Promise<VerificationResult> {
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

    // Count NFTs by collection
    const collectionCounts = nfts.reduce((acc, nft) => {
      acc[nft.collection] = (acc[nft.collection] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const collections = Object.entries(collectionCounts).map(([name, count]) => ({
      name,
      count
    }));

    return {
      isHolder: true,
      collections,
      buxBalance: balance ? Number(balance.balance) / 1_000_000_000 : 0,
      totalNFTs: nfts.length,
      totalValue: 0,
      assignedRoles: []
    };

  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 