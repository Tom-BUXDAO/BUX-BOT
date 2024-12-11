import { prisma } from '@/lib/prisma';
import type { VerificationResult, Collections } from '@/types/verification';
import type { RoleConfig } from '@/types/roles';
import type { TokenBalance, NFT, Roles, Prisma } from '@prisma/client';

interface NFTCount {
  collection: string;
  _count: number;
}

export async function verifyHolder(walletAddress: string, discordId: string): Promise<VerificationResult> {
  try {
    // Get all data in parallel
    const [userRoles, nftCountsResult, tokenBalances, roleConfigs] = await Promise.all([
      prisma.roles.findUnique({
        where: { discordId }
      }),
      prisma.$queryRaw<NFTCount[]>`
        SELECT collection, COUNT(*) as _count
        FROM "NFT"
        WHERE "ownerDiscordId" = ${discordId}
        GROUP BY collection
      `,
      prisma.tokenBalance.findMany({
        where: { ownerDiscordId: discordId }
      }),
      prisma.$queryRaw<RoleConfig[]>`
        SELECT * FROM "RoleConfig"
      `
    ]);

    // Calculate BUX balance
    const buxBalance = Number(tokenBalances.reduce((sum: bigint, { balance }: TokenBalance) => sum + balance, BigInt(0))) / 1e9;

    // Build collections object
    const collections: Collections = {};
    nftCountsResult.forEach(({ collection, _count }: NFTCount) => {
      collections[collection] = { count: Number(_count) };
    });

    // Get assigned roles from database
    const assignedRoles = Object.entries(userRoles || {})
      .filter(([key, value]) => value === true && !key.startsWith('_'))
      .map(([key]) => {
        const config = roleConfigs.find((rc: RoleConfig) => rc.roleName === key);
        return config?.roleId ?? key;
      });

    // Calculate total NFTs
    const totalNFTs = nftCountsResult.reduce((sum: number, { _count }: NFTCount) => sum + Number(_count), 0);

    return {
      isHolder: assignedRoles.length > 0,
      collections,
      buxBalance,
      totalNFTs,
      assignedRoles,
      qualifyingBuxRoles: [], // Now handled by database triggers
      roleUpdate: {
        added: [],
        removed: [],
        previousRoles: [],
        newRoles: assignedRoles
      }
    };
  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 