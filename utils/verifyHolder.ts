import { prisma } from '@/lib/prisma';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';
import { updateDiscordRoles } from './discordRoles';
import type { VerificationResult, Collections, CollectionInfo } from '@/types/verification';

interface WhaleConfig {
  holder: string | undefined;
  whale: {
    roleId: string | undefined;
    threshold: number;
  };
}

function hasWhaleConfig(config: typeof NFT_THRESHOLDS[CollectionName]): config is WhaleConfig {
  return config !== undefined && 'whale' in config;
}

function normalizeCollectionName(dbName: string): CollectionName {
  const nameMap: Record<string, CollectionName> = {
    'money_monsters3d': 'Money Monsters 3D',
    'money_monsters': 'Money Monsters',
    'ai_bitbots': 'AI BitBots',
    'fcked_catz': 'FCKED CATZ',
    'celebcatz': 'CelebCatz',
    'candy_bots': 'Candy Bots',
    'doodle_bot': 'Doodle Bots',
    'energy_apes': 'Energy Apes',
    'rjctd_bots': 'RJCTD Bots',
    'squirrels': 'Squirrels',
    'warriors': 'Warriors'
  };
  return nameMap[dbName] || dbName as CollectionName;
}

// Helper to get highest qualifying BUX role
function getHighestBuxRole(buxBalance: number): string | undefined {
  const sortedTiers = [...BUX_THRESHOLDS].sort((a, b) => b.threshold - a.threshold);
  return sortedTiers.find(tier => buxBalance >= tier.threshold)?.roleId;
}

export async function verifyHolder(walletAddress: string, discordId: string): Promise<VerificationResult> {
  try {
    // Get NFT counts and token balances
    const [nftCounts, tokenBalances] = await Promise.all([
      prisma.nFT.groupBy({
        by: ['collection'],
        where: { ownerDiscordId: discordId },
        _count: true
      }),
      prisma.tokenBalance.findMany({
        where: { ownerDiscordId: discordId }
      })
    ]);

    console.log('NFT counts across all wallets:', nftCounts);
    
    const buxBalance = Number(tokenBalances.reduce((sum, { balance }) => sum + balance, BigInt(0))) / 1e9;
    const totalNFTs = nftCounts.reduce((sum, { _count }) => sum + _count, 0);

    // Convert array to Collections object
    const collectionsObj: Collections = {};
    nftCounts.forEach(({ collection, _count }) => {
      collectionsObj[collection] = {  // Use DB name directly
        count: _count,
      };
    });

    return {
      isHolder: totalNFTs > 0 || buxBalance > 0,
      collections: collectionsObj,
      buxBalance,
      totalNFTs,
      assignedRoles: [],
      qualifyingBuxRoles: [],
      roleUpdate: {
        added: [],
        removed: [],
        previousRoles: [],
        newRoles: []
      }
    };

  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 