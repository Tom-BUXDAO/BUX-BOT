import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface CollectionCount {
  name: string;
  count: number;
  mint: string;
}

export async function verifyHolder(walletAddress: string): Promise<{
  isHolder: boolean;
  collections: CollectionCount[];
}> {
  try {
    // First check NFTs in our database
    const ownedNFTs = await prisma.nFT.findMany({
      where: {
        ownerWallet: walletAddress,
        image: { not: null } // Exclude burned NFTs
      },
      select: {
        mint: true,
        name: true,
        collection: true
      }
    });

    console.log(`Found ${ownedNFTs.length} NFTs in database for wallet:`, walletAddress);

    // Group by collection and count
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
      collections
    };

  } catch (error) {
    console.error('Error verifying holder:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
} 