import { VerifyResult } from '@/types/verification';
import { NFTHoldingWithCollection } from '@/types/wallet';
import { Prisma, NFT } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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

export async function verifyHolder(walletAddress: string): Promise<VerifyResult> {
  console.log(`Verifying wallet ${walletAddress}...`);
  const startTime = Date.now();

  // Check cache first
  const cached = verificationCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached result for ${walletAddress}`);
    return cached.result;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [nfts, tokenBalance] = await Promise.all([
        tx.nFT.findMany({
          where: { ownerWallet: walletAddress },
          include: { currentOwner: true }
        }),
        tx.tokenBalance.findUnique({
          where: { walletAddress }
        })
      ]);

      // Log NFT details for debugging
      console.log('NFTs found:', nfts.map(nft => ({
        name: nft.name,
        collection: nft.collection,
        mint: nft.mint
      })));

      // Calculate BUX balance in standard units
      const buxBalance = Number(tokenBalance?.balance ?? 0);
      const standardBuxBalance = buxBalance / Math.pow(10, BUX_DECIMALS);

      console.log(`Found ${nfts.length} NFTs and ${buxBalance} BUX (${standardBuxBalance} standard) for ${walletAddress}`);

      if (!nfts.length && !tokenBalance?.balance) {
        return {
          isHolder: false,
          collections: [],
          buxBalance: 0,
          totalNFTs: 0,
          totalValue: 0,
          assignedRoles: []
        } as VerifyResult;
      }

      // Aggregate collection data
      const collections = nfts.reduce((acc: Array<{ name: string; count: number }>, nft) => {
        if (!nft.collection) return acc;
        // Normalize collection name
        const normalizedName = nft.collection.trim().toLowerCase();
        const existing = acc.find(c => c.name.toLowerCase() === normalizedName);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ name: nft.collection, count: 1 });
        }
        return acc;
      }, []);

      console.log('Aggregated collections:', collections);

      // Determine roles based on holdings
      const assignedRoles: string[] = [];

      // BUX balance roles - check in descending order
      console.log('Checking BUX balance roles:', {
        balance: standardBuxBalance,
        thresholds: {
          banker: THRESHOLDS.BUX_BANKER,
          saver: THRESHOLDS.BUX_SAVER,
          builder: THRESHOLDS.BUX_BUILDER,
          beginner: THRESHOLDS.BUX_BEGINNER
        }
      });

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
        const normalizedName = collection.name.trim().toLowerCase()
          .replace(/[\s_-]+/g, ''); // Remove all spaces, underscores, and hyphens
        
        console.log('Checking collection:', {
          original: collection.name,
          normalized: normalizedName,
          count: collection.count
        });

        switch (normalizedName) {
          case 'aibitbots':
            console.log('Assigning AI BitBots role');
            assignedRoles.push(process.env.AI_BITBOTS_ROLE_ID!);
            if (collection.count >= THRESHOLDS.AI_BITBOTS_WHALE) {
              assignedRoles.push(process.env.AI_BITBOTS_WHALE_ROLE_ID!);
            }
            break;
          case 'moneymonsters':
            console.log('Assigning Money Monsters role');
            assignedRoles.push(process.env.MONEY_MONSTERS_ROLE_ID!);
            if (collection.count >= THRESHOLDS.MONEY_MONSTERS_WHALE) {
              assignedRoles.push(process.env.MONEY_MONSTERS_WHALE_ROLE_ID!);
            }
            break;
          case 'moneymonsters3d':
            console.log('Assigning Money Monsters 3D role');
            assignedRoles.push(process.env.MONEY_MONSTERS3D_ROLE_ID!);
            if (collection.count >= THRESHOLDS.MONEY_MONSTERS3D_WHALE) {
              assignedRoles.push(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!);
            }
            break;
          case 'fckedcatz':
            console.log('Assigning FCKED CATZ role');
            assignedRoles.push(process.env.FCKED_CATZ_ROLE_ID!);
            if (collection.count >= THRESHOLDS.FCKED_CATZ_WHALE) {
              assignedRoles.push(process.env.FCKED_CATZ_WHALE_ROLE_ID!);
            }
            break;
          case 'candybots':
            console.log('Assigning Candy Bots role');
            assignedRoles.push(process.env.CANDY_BOTS_ROLE_ID!);
            break;
          case 'doodlebots':
            console.log('Assigning Doodle Bots role');
            assignedRoles.push(process.env.DOODLE_BOTS_ROLE_ID!);
            break;
          case 'energyapes':
            console.log('Assigning Energy Apes role');
            assignedRoles.push(process.env.ENERGY_APES_ROLE_ID!);
            break;
          case 'rjctdbots':
            console.log('Assigning RJCTD Bots role');
            assignedRoles.push(process.env.RJCTD_BOTS_ROLE_ID!);
            break;
          case 'squirrels':
            console.log('Assigning Squirrels role');
            assignedRoles.push(process.env.SQUIRRELS_ROLE_ID!);
            break;
          case 'warriors':
            console.log('Assigning Warriors role');
            assignedRoles.push(process.env.WARRIORS_ROLE_ID!);
            break;
        }
      });

      // Check for BUXDAO 5 role (hold at least 1 NFT from each main collection)
      const mainCollections = ['money monsters', 'money monsters 3d', 'celeb catz', 'fcked catz', 'ai bitbots'];
      const hasAllMainCollections = mainCollections.every(name => 
        collections.some(c => c.name.toLowerCase() === name)
      );
      if (hasAllMainCollections) {
        assignedRoles.push(process.env.BUXDAO_5_ROLE_ID!);
      }

      console.log(`Assigned roles for ${walletAddress}:`, {
        roles: assignedRoles,
        buxBalance: standardBuxBalance,
        collections: collections.map(c => `${c.count}x ${c.name}`),
      });

      const verifyResult = {
        isHolder: collections.length > 0 || buxBalance > 0,
        collections,
        buxBalance,
        totalNFTs: nfts.length,
        totalValue: 0,
        assignedRoles: assignedRoles.filter(Boolean)
      } as VerifyResult;

      // Cache the result
      verificationCache.set(walletAddress, {
        result: verifyResult,
        timestamp: Date.now()
      });

      return verifyResult;
    });

    console.log(`Verification completed for ${walletAddress} in ${Date.now() - startTime}ms`);
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