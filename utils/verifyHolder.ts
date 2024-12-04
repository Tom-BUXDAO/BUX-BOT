import { prisma } from '@/lib/prisma';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';
import { updateDiscordRoles } from './discordRoles';
import type { VerificationResult, CollectionInfo } from '@/types/verification';

function hasWhaleConfig(config: typeof NFT_THRESHOLDS[CollectionName]): config is { holder: string | undefined; whale: { roleId: string | undefined; threshold: number } } {
  return 'whale' in config;
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
  // Sort thresholds from highest to lowest
  const sortedTiers = [...BUX_THRESHOLDS].sort((a, b) => b.threshold - a.threshold);
  
  // Find highest tier user qualifies for
  const highestTier = sortedTiers.find(tier => buxBalance >= tier.threshold);
  return highestTier?.roleId;
}

// Fix the whale property access
function isWhaleForCollection(collection: string, count: number): boolean {
  const config = NFT_THRESHOLDS[normalizeCollectionName(collection)];
  return hasWhaleConfig(config) && count >= config.whale.threshold;
}

export async function verifyHolder(walletAddress: string, discordId: string): Promise<VerificationResult> {
  try {
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

    // Get NFT-based roles
    const nftRoles = nftCounts.flatMap(({ collection, _count }) => {
      const normalizedName = normalizeCollectionName(collection);
      const config = NFT_THRESHOLDS[normalizedName];
      const roles = [];
      
      if (config?.holder) roles.push(config.holder);
      if (hasWhaleConfig(config) && _count >= config.whale.threshold && config.whale.roleId) {
        roles.push(config.whale.roleId);
      }
      
      return roles;
    });

    // Get highest qualifying BUX role
    const highestBuxRole = getHighestBuxRole(buxBalance);

    // Combine roles
    const assignedRoles = [
      ...nftRoles,
      ...(highestBuxRole ? [highestBuxRole] : []),
      ...(nftCounts.length >= 5 && BUXDAO_5_ROLE_ID ? [BUXDAO_5_ROLE_ID] : [])
    ];

    // Get all BUX roles for display
    const qualifyingBuxRoles = BUX_THRESHOLDS
      .filter(tier => buxBalance >= tier.threshold)
      .map(tier => tier.roleId)
      .filter((id): id is string => id !== undefined);

    const roleUpdate = await updateDiscordRoles(discordId, assignedRoles);

    return {
      isHolder: totalNFTs > 0 || buxBalance > 0,
      collections: nftCounts.map(({ collection, _count }) => ({
        name: normalizeCollectionName(collection),
        count: _count,
        isWhale: isWhaleForCollection(collection, _count)
      })),
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