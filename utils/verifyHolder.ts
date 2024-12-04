import { prisma } from '@/lib/prisma';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';
import { updateDiscordRoles } from './discordRoles';
import type { VerificationResult } from '../types/verification';

function hasWhaleConfig(config: typeof NFT_THRESHOLDS[CollectionName]): config is {
  holder: string | undefined;
  whale: { roleId: string | undefined; threshold: number };
} {
  return 'whale' in config && config.whale !== undefined;
}

// Normalize collection names to match config
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

// Add chunking for role updates
async function updateRolesInChunks(discordId: string, roles: string[], chunkSize = 3) {
  const chunks = [];
  for (let i = 0; i < roles.length; i += chunkSize) {
    chunks.push(roles.slice(i, i + chunkSize));
  }

  let finalRoleUpdate = {
    added: [] as string[],
    removed: [] as string[],
    previousRoles: [] as string[],
    newRoles: [] as string[]
  };

  for (const chunk of chunks) {
    const update = await updateDiscordRoles(discordId, chunk);
    finalRoleUpdate = {
      added: [...finalRoleUpdate.added, ...update.added],
      removed: [...finalRoleUpdate.removed, ...update.removed],
      previousRoles: update.previousRoles, // Use latest
      newRoles: update.newRoles // Use latest
    };
    // Add delay between chunks
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return finalRoleUpdate;
}

export async function verifyHolder(
  walletAddress: string, 
  discordId: string
): Promise<VerificationResult> {
  try {
    // Get current Discord roles
    const discordRoles = await updateDiscordRoles(discordId, []);

    // First update ownership records for current wallet
    await prisma.$transaction([
      prisma.nFT.updateMany({
        where: { ownerWallet: walletAddress },
        data: { ownerDiscordId: discordId }
      }),
      prisma.tokenBalance.upsert({
        where: { walletAddress },
        create: {
          walletAddress,
          ownerDiscordId: discordId,
          balance: BigInt(0)
        },
        update: {
          ownerDiscordId: discordId
        }
      })
    ]);

    // Get NFT counts across all wallets owned by this Discord ID
    const nftCounts = await prisma.nFT.groupBy({
      by: ['collection'],
      where: {
        ownerDiscordId: discordId
      },
      _count: true
    });

    console.log('NFT counts across all wallets:', nftCounts);

    // Get total BUX balance across all wallets
    const tokenBalances = await prisma.tokenBalance.findMany({
      where: { ownerDiscordId: discordId }
    });

    const totalBuxBalance = tokenBalances.reduce(
      (sum, { balance }) => sum + balance,
      BigInt(0)
    );

    const buxBalance = Number(totalBuxBalance) / 1e9;
    const totalNFTs = nftCounts.reduce((sum, { _count }) => sum + _count, 0);

    // Calculate roles based on total holdings
    const assignedRoles: string[] = [];

    // Add collection roles
    nftCounts.forEach(({ collection, _count }) => {
      const normalizedName = normalizeCollectionName(collection);
      const config = NFT_THRESHOLDS[normalizedName];
      
      if (config?.holder) {
        assignedRoles.push(config.holder);
      }
      if (hasWhaleConfig(config) && _count >= config.whale.threshold && config.whale.roleId) {
        assignedRoles.push(config.whale.roleId);
      }
    });

    // Add BUX roles
    BUX_THRESHOLDS.forEach(tier => {
      if (buxBalance >= tier.threshold && tier.roleId) {
        assignedRoles.push(tier.roleId);
      }
    });

    // Add BUXDAO 5 role if qualified
    if (nftCounts.length >= 5 && BUXDAO_5_ROLE_ID) {
      assignedRoles.push(BUXDAO_5_ROLE_ID);
    }

    // Update Discord roles in chunks
    const roleUpdate = await updateRolesInChunks(discordId, assignedRoles);

    return {
      isHolder: totalNFTs > 0 || buxBalance > 0,
      collections: nftCounts.map(({ collection, _count }) => {
        const normalizedName = normalizeCollectionName(collection);
        const config = NFT_THRESHOLDS[normalizedName];
        return {
          name: normalizedName,
          count: _count,
          isWhale: hasWhaleConfig(config) ? _count >= config.whale.threshold : false
        };
      }),
      buxBalance,
      totalNFTs,
      assignedRoles,
      roleUpdate
    };

  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 