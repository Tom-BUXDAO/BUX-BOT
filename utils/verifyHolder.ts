import { prisma } from '@/lib/prisma';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';
import { updateDiscordRoles } from './discordRoles';
import type { VerificationResult } from '@/types/verification';

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

    // Calculate roles in specific order
    const assignedRoles: string[] = [];
    const collections = new Map(nftCounts.map(({ collection, _count }) => [collection, _count]));

    // Check roles in order
    const checkOrder = [
      'money_monsters',
      'money_monsters_whale',
      'fcked_catz',
      'fcked_catz_whale',
      'ai_bitbots',
      'ai_bitbots_whale',
      'money_monsters3d',
      'money_monsters3d_whale',
      'celebcatz',
      'warriors',
      'squirrels',
      'energy_apes',
      'rjctd_bots',
      'candy_bots',
      'doodle_bot'
    ];

    for (const collection of checkOrder) {
      const count = collections.get(collection) || 0;
      const config = NFT_THRESHOLDS[normalizeCollectionName(collection)];
      
      console.log(`Checking ${collection}: Count=${count}`);

      if (config?.holder && count > 0) {
        console.log(`Adding holder role for ${collection}`);
        assignedRoles.push(config.holder);
      }
      
      if (hasWhaleConfig(config) && count >= config.whale.threshold && config.whale.roleId) {
        console.log(`Adding whale role for ${collection}`);
        assignedRoles.push(config.whale.roleId);
      }
    }

    // Check BUXDAO 5
    if (nftCounts.length >= 5 && BUXDAO_5_ROLE_ID) {
      console.log('Adding BUXDAO 5 role');
      assignedRoles.push(BUXDAO_5_ROLE_ID);
    }

    // Add highest BUX role
    const highestBuxRole = getHighestBuxRole(buxBalance);
    if (highestBuxRole) {
      console.log(`Adding BUX role: ${highestBuxRole}`);
      assignedRoles.push(highestBuxRole);
    }

    const roleUpdate = await updateDiscordRoles(discordId, assignedRoles);

    // Get qualifying BUX roles for display
    const qualifyingBuxRoles = BUX_THRESHOLDS
      .filter(tier => buxBalance >= tier.threshold)
      .map(tier => tier.roleId)
      .filter((id): id is string => id !== undefined);

    return {
      isHolder: totalNFTs > 0 || buxBalance > 0,
      collections: nftCounts.map(({ collection, _count }) => {
        const normalizedName = normalizeCollectionName(collection);
        const config = NFT_THRESHOLDS[normalizedName];
        return {
          name: normalizedName,
          count: _count,
          isWhale: hasWhaleConfig(config) && 
                  _count >= config.whale.threshold
        };
      }),
      buxBalance,
      totalNFTs,
      assignedRoles,
      qualifyingBuxRoles,
      roleUpdate
    };

  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 