import { prisma } from '@/lib/prisma';
import { VerifyResult } from '@/types/verification';
import { NFTHoldingWithCollection } from '@/types/wallet';
import { createRateLimit } from '@/utils/rateLimit';
import { Prisma, NFT, PrismaClient } from '@prisma/client';

// Create rate limiter instance
const rateLimiter = createRateLimit({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 100
});

type NFTListingAggregate = {
  _sum: {
    price: number | null;
  };
};

type NFTWithOwner = NFT & {
  currentOwner: {
    discordId: string;
    discordName: string;
  } | null;
};

// Get the type of the Prisma client
type PrismaType = typeof prisma;

/**
 * Verifies if a wallet address holds any NFTs or tokens in our collections
 * @param walletAddress The wallet address to verify
 * @returns VerifyResult containing holder status and collection details
 */
export async function verifyHolder(walletAddress: string): Promise<VerifyResult> {
  const startTime = Date.now();
  
  try {
    // Log verification attempt
    console.log(`Verifying holder status for wallet: ${walletAddress}`);

    // First check our database using proper Prisma select types
    const nfts = await prisma.$transaction(async (tx) => {
      return await tx.nFT.findMany({
        where: {
          ownerWallet: walletAddress
        },
        include: {
          currentOwner: true
        }
      });
    });

    if (!nfts.length) {
      console.log(`No NFTs found for wallet: ${walletAddress}`);
      return {
        isHolder: false,
        collections: [],
        buxBalance: 0,
        totalNFTs: 0,
        totalValue: 0
      };
    }

    // Aggregate collection data
    const collections = nfts.reduce((acc: Array<{ name: string; count: number }>, nft: NFTWithOwner) => {
      const collectionName = nft.collection;
      if (!collectionName) return acc;

      const existing = acc.find(c => c.name === collectionName);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          name: collectionName,
          count: 1
        });
      }
      return acc;
    }, []);

    // Get BUX balance
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: {
        walletAddress: walletAddress
      }
    });

    const buxBalance = Number(tokenBalance?.balance ?? 0);
    
    // Calculate total value from NFT listings if available
    const totalValue = await (prisma as PrismaType & { NFTListing: any }).NFTListing.aggregate({
      where: {
        nftId: {
          in: nfts.map((nft: NFTWithOwner) => nft.id)
        }
      },
      _sum: {
        price: true
      }
    }).then((result: NFTListingAggregate) => Number(result._sum.price ?? 0));

    const result = {
      isHolder: collections.length > 0 || buxBalance > 0,
      collections,
      buxBalance,
      totalNFTs: nfts.length,
      totalValue
    };

    // Log successful verification
    console.log(`Verification completed for ${walletAddress} in ${Date.now() - startTime}ms`, {
      isHolder: result.isHolder,
      collectionsCount: collections.length,
      totalNFTs: result.totalNFTs
    });

    return result;

  } catch (error) {
    // Log detailed error information
    console.error('Error verifying holder:', {
      walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    });

    // Create verification record with error
    await (prisma as PrismaType & { WalletVerification: any }).WalletVerification.create({
      data: {
        walletAddress,
        userId: 'system',
        status: 'error',
        result: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }
    }).catch((err: Error) => {
      console.error('Failed to log verification error:', err);
    });

    throw error;
  }
} 