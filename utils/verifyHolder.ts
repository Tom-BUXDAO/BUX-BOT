import { prisma } from '@/lib/prisma';
import { VerifyResult } from '@/types/verification';
import { NFTHoldingWithCollection } from '@/types/wallet';
import { createRateLimit } from '@/utils/rateLimit';
import { Prisma, NFT } from '@prisma/client';

// Cache verification results for 5 minutes
const verificationCache = new Map<string, { result: VerifyResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const BUX_DECIMALS = 9;

// Role thresholds from environment variables
const THRESHOLDS = {
  BUX_BEGINNER: Number(process.env.BUX_BEGINNER_THRESHOLD || 2500),
  BUX_BUILDER: Number(process.env.BUX_BUILDER_THRESHOLD || 10000),
  BUX_SAVER: Number(process.env.BUX_SAVER_THRESHOLD || 25000),
  BUX_BANKER: Number(process.env.BUX_BANKER_THRESHOLD || 50000),
  AI_BITBOTS_WHALE: Number(process.env.AI_BITBOTS_WHALE_THRESHOLD || 10),
  FCKED_CATZ_WHALE: Number(process.env.FCKED_CATZ_WHALE_THRESHOLD || 25),
  MONEY_MONSTERS_WHALE: Number(process.env.MONEY_MONSTERS_WHALE_THRESHOLD || 25),
  MONEY_MONSTERS3D_WHALE: Number(process.env.MONEY_MONSTERS3D_WHALE_THRESHOLD || 25),
};

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

      // Calculate BUX balance in standard units
      const buxBalance = Number(tokenBalance?.balance ?? 0);
      const standardBuxBalance = buxBalance / Math.pow(10, BUX_DECIMALS);

      // Determine roles based on holdings
      const assignedRoles: string[] = [];

      // BUX balance roles
      if (standardBuxBalance >= THRESHOLDS.BUX_BANKER) {
        assignedRoles.push(process.env.BUX_BANKER_ROLE_ID!);
      } else if (standardBuxBalance >= THRESHOLDS.BUX_SAVER) {
        assignedRoles.push(process.env.BUX_SAVER_ROLE_ID!);
      } else if (standardBuxBalance >= THRESHOLDS.BUX_BUILDER) {
        assignedRoles.push(process.env.BUX_BUILDER_ROLE_ID!);
      } else if (standardBuxBalance >= THRESHOLDS.BUX_BEGINNER) {
        assignedRoles.push(process.env.BUX_BEGINNER_ROLE_ID!);
      }

      // NFT collection roles
      collections.forEach(collection => {
        switch (collection.name) {
          case 'AI BitBots':
            assignedRoles.push(process.env.AI_BITBOTS_ROLE_ID!);
            if (collection.count >= THRESHOLDS.AI_BITBOTS_WHALE) {
              assignedRoles.push(process.env.AI_BITBOTS_WHALE_ROLE_ID!);
            }
            break;
          case 'FCKED CATZ':
            assignedRoles.push(process.env.FCKED_CATZ_ROLE_ID!);
            if (collection.count >= THRESHOLDS.FCKED_CATZ_WHALE) {
              assignedRoles.push(process.env.FCKED_CATZ_WHALE_ROLE_ID!);
            }
            break;
          // Add other collections...
        }
      });

      const result = {
        isHolder: collections.length > 0 || buxBalance > 0,
        collections,
        buxBalance,
        totalNFTs: nfts.length,
        totalValue: 0,
        assignedRoles: assignedRoles.filter(Boolean) // Remove any undefined roles
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