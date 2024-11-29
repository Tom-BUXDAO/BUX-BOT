import { prisma } from '@/lib/prisma';
import { VerifyResult } from '@/types/verification';
import { NFTHoldingWithCollection } from '@/types/wallet';
import { createRateLimit } from '@/utils/rateLimit';
import { Prisma, NFT, PrismaClient } from '@prisma/client';
import { NextApiResponse } from 'next';

// Create rate limiter instance with more conservative limits
const rateLimiter = createRateLimit({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 20  // Reduced from 100 to 20 requests per minute
});

type NFTWithOwner = NFT & {
  currentOwner: {
    discordId: string;
    discordName: string;
  } | null;
};

type NFTListing = {
  price: string | null;
};

// Get the Prisma client type with proper casing
type ExtendedPrismaClient = PrismaClient & {
  nftListing: any;
  verificationHistory: any;
};

/**
 * Verifies if a wallet address holds any NFTs or tokens in our collections
 * @param walletAddress The wallet address to verify
 * @returns VerifyResult containing holder status and collection details
 */
export async function verifyHolder(walletAddress: string): Promise<VerifyResult> {
  const startTime = Date.now();
  const client = prisma as ExtendedPrismaClient;
  
  try {
    // Check rate limit before proceeding
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          if (code === 429) throw new Error('Rate limit exceeded. Please try again later.');
          return data;
        }
      })
    } as NextApiResponse;

    const isAllowed = await rateLimiter.check(mockRes, 20, walletAddress);
    if (!isAllowed) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Log verification attempt
    console.log(`Verifying holder status for wallet: ${walletAddress}`);

    // Use a single transaction for all database operations
    const result = await client.$transaction(async (tx) => {
      // Get NFTs
      const nfts = await tx.nFT.findMany({
        where: {
          ownerWallet: walletAddress
        },
        include: {
          currentOwner: true
        }
      });

      if (!nfts.length) {
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
      const tokenBalance = await tx.tokenBalance.findUnique({
        where: { walletAddress }
      });

      // Get total value from active listings
      const listings = await client.nftListing.findMany({
        where: {
          nftId: {
            in: nfts.map(nft => nft.id)
          }
        },
        select: {
          price: true
        }
      });

      const totalValue = listings.reduce((sum: number, listing: NFTListing) => 
        sum + Number(listing.price ?? 0), 0);

      return {
        isHolder: collections.length > 0 || Number(tokenBalance?.balance ?? 0) > 0,
        collections,
        buxBalance: Number(tokenBalance?.balance ?? 0),
        totalNFTs: nfts.length,
        totalValue
      };
    });

    // Log successful verification
    console.log(`Verification completed for ${walletAddress} in ${Date.now() - startTime}ms`, {
      isHolder: result.isHolder,
      collectionsCount: result.collections.length,
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
    await client.$transaction([
      client.verificationHistory.create({
        data: {
          walletAddress,
          userId: 'system',
          status: 'error',
          result: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        }
      })
    ]);

    throw error;
  }
} 