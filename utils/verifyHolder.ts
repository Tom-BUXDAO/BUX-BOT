import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CollectionCount {
  name: string;
  count: number;
  mint: string;
}

export async function verifyHolder(walletAddress: string): Promise<{
  isHolder: boolean;
  collections: CollectionCount[];
  buxBalance: number;
}> {
  try {
    // Check NFTs in database
    const ownedNFTs = await prisma.nFT.findMany({
      where: {
        ownerWallet: walletAddress,
        image: { not: null }
      },
      select: {
        mint: true,
        name: true,
        collection: true
      }
    });

    // Get BUX balance from database
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { walletAddress }
    });

    const collectionCounts = ownedNFTs.reduce((acc, nft) => {
      if (!acc[nft.collection]) {
        acc[nft.collection] = {
          name: nft.collection,
          count: 0,
          mint: nft.mint
        };
      }
      acc[nft.collection].count++;
      return acc;
    }, {} as Record<string, CollectionCount>);

    const collections = Object.values(collectionCounts);
    
    return {
      isHolder: collections.length > 0,
      collections,
      buxBalance: tokenBalance?.balance || 0
    };

  } catch (error) {
    console.error('Error verifying holder:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
} 