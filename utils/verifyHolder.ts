import { PrismaClient } from '@prisma/client';
import { Connection, PublicKey } from '@solana/web3.js';

const prisma = new PrismaClient();

interface CollectionCount {
  name: string;
  count: number;
  mint: string;
}

export async function verifyHolder(walletAddress: string) {
  try {
    // Get NFTs owned by this wallet
    const nfts = await prisma.nFT.findMany({
      where: {
        ownerWallet: walletAddress
      },
      select: {
        collection: true,
        mint: true
      }
    });

    console.log(`Found ${nfts.length} NFTs in database for wallet: ${walletAddress}`);

    // Count NFTs by collection
    const collectionCounts = new Map<string, { count: number; mint: string }>();
    nfts.forEach(nft => {
      const current = collectionCounts.get(nft.collection);
      if (current) {
        collectionCounts.set(nft.collection, {
          count: current.count + 1,
          mint: current.mint
        });
      } else {
        collectionCounts.set(nft.collection, {
          count: 1,
          mint: nft.mint
        });
      }
    });

    // Format collections array
    const collections: CollectionCount[] = Array.from(collectionCounts.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      mint: data.mint
    }));

    // Get BUX balance
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: {
        walletAddress
      }
    });

    return {
      isHolder: collections.length > 0,
      collections,
      buxBalance: Number(tokenBalance?.balance || BigInt(0))
    };

  } catch (error) {
    console.error('Error verifying holder:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
} 