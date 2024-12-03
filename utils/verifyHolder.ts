import { prisma } from '@/lib/prisma';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';
import { updateDiscordRoles } from './discordRoles';
import type { VerificationResult } from '../types/verification';

// Type guard for collections with whale thresholds
function hasWhaleConfig(config: typeof NFT_THRESHOLDS[CollectionName] | undefined): config is {
  holder: string | undefined;
  whale: { roleId: string | undefined; threshold: number };
} {
  return config !== undefined && 'whale' in config && config.whale !== undefined;
}

export async function verifyHolder(
  walletAddress: string, 
  discordId: string
): Promise<VerificationResult> {
  try {
    // First update ownership records
    await prisma.$transaction([
      // Update NFTs ownership
      prisma.nFT.updateMany({
        where: { ownerWallet: walletAddress },
        data: { ownerDiscordId: discordId }
      }),
      // Update token balance ownership
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

    // Get NFT counts by collection
    const nftCounts = await prisma.nFT.groupBy({
      by: ['collection'],
      where: {
        ownerWallet: walletAddress,
        ownerDiscordId: discordId
      },
      _count: true
    });

    // Get BUX balance
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { walletAddress }
    });

    const buxBalance = tokenBalance ? Number(tokenBalance.balance) / 1e9 : 0;
    const totalNFTs = nftCounts.reduce((sum, { _count }) => sum + _count, 0);

    // Calculate roles based on holdings
    const assignedRoles: string[] = [];

    // Add collection roles
    nftCounts.forEach(({ collection, _count }) => {
      const config = NFT_THRESHOLDS[collection as CollectionName];
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

    // Update Discord roles
    const roleUpdate = await updateDiscordRoles(discordId, assignedRoles);

    return {
      isHolder: totalNFTs > 0 || buxBalance > 0,
      collections: nftCounts.map(({ collection, _count }) => {
        const config = NFT_THRESHOLDS[collection as CollectionName];
        const whaleThreshold = hasWhaleConfig(config) ? config.whale.threshold : Infinity;
        return {
          name: collection as CollectionName,
          count: _count,
          isWhale: _count >= whaleThreshold
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