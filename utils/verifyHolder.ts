import { prisma } from '@/lib/prisma';
import { VerifyResult } from '@/types/verification';
import { NFTHoldingWithCollection } from '@/types/wallet';
import { createRateLimit } from '@/utils/rateLimit';
import { Prisma, NFT } from '@prisma/client';

// Cache verification results for 5 minutes
const verificationCache = new Map<string, { result: VerifyResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Verifies if a wallet address holds any NFTs or tokens in our collections
 * @param walletAddress The wallet address to verify
 * @returns VerifyResult containing holder status and collection details
 */
export async function verifyHolder(walletAddress: string): Promise<VerifyResult> {
  // Check cache first
  const cached = verificationCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  const startTime = Date.now();
  
  try {
    // Single database transaction for all queries
    const result = await prisma.$transaction(async (tx) => {
      // Get NFTs and token balance in parallel
      const [nfts, tokenBalance] = await Promise.all([
        tx.nFT.findMany({
          where: { ownerWallet: walletAddress },
          include: { currentOwner: true }
        }),
        tx.tokenBalance.findUnique({
          where: { walletAddress }
        })
      ]);

      if (!nfts.length && !tokenBalance?.balance) {
        return {
          isHolder: false,
          collections: [],
          buxBalance: 0,
          totalNFTs: 0,
          totalValue: 0
        };
      }

      // Aggregate collection data
      const collections = nfts.reduce((acc: Array<{ name: string; count: number }>, nft) => {
        if (!nft.collection) return acc;
        const existing = acc.find(c => c.name === nft.collection);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ name: nft.collection, count: 1 });
        }
        return acc;
      }, []);

      const result = {
        isHolder: collections.length > 0 || Number(tokenBalance?.balance ?? 0) > 0,
        collections,
        buxBalance: Number(tokenBalance?.balance ?? 0),
        totalNFTs: nfts.length,
        totalValue: 0 // Calculate from NFT metadata if needed
      };

      // Cache the result
      verificationCache.set(walletAddress, {
        result,
        timestamp: Date.now()
      });

      return result;
    });

    return result;

  } catch (error) {
    console.error('Error verifying holder:', {
      walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });

    throw error;
  }
} 