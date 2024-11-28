import { PrismaClient } from '@prisma/client';
import { updateDiscordRoles } from './discordRoles';
import { TokenBalanceWithOwner } from '@/types/prisma';
import { CollectionName, NFT_THRESHOLDS } from './roleConfig';

const prisma = new PrismaClient();

interface CollectionCount {
  name: CollectionName;
  count: number;
  mint: string;
}

interface VerifyResult {
  isHolder: boolean;
  collections: CollectionCount[];
  buxBalance: number;
  totalNFTs: number;
  totalValue: number;
  assignedRoles?: string[];
}

export async function verifyHolder(walletAddress: string, discordId?: string): Promise<VerifyResult> {
  try {
    if (!discordId) {
      throw new Error('Discord ID is required for verification');
    }

    // Get NFTs, BUX balance, and linked wallets in a single transaction
    const [nfts, tokenBalance] = await prisma.$transaction([
      // Get NFTs owned by this wallet with collection info
      prisma.$queryRaw<{ collection: string; mint: string; price: number }[]>`
        SELECT 
          CASE 
            WHEN n."collection" = 'money_monsters3d' THEN 'Money Monsters 3D'
            WHEN n."collection" = 'money_monsters' THEN 'Money Monsters'
            WHEN n."collection" = 'fcked_catz' THEN 'FCKED CATZ'
            WHEN n."collection" = 'ai_bitbots' THEN 'AI BitBots'
            WHEN n."collection" = 'celebcatz' THEN 'CelebCatz'
            WHEN n."collection" = 'candy_bots' THEN 'Candy Bots'
            WHEN n."collection" = 'doodle_bots' THEN 'Doodle Bots'
            WHEN n."collection" = 'energy_apes' THEN 'Energy Apes'
            WHEN n."collection" = 'rjctd_bots' THEN 'RJCTD Bots'
            WHEN n."collection" = 'squirrels' THEN 'Squirrels'
            WHEN n."collection" = 'warriors' THEN 'Warriors'
            ELSE n."collection"
          END as collection,
          n."mint",
          COALESCE(l."price", s."price", 0) as price
        FROM "NFT" n
        LEFT JOIN "NFTListing" l ON l."nftId" = n."id"
        LEFT JOIN (
          SELECT DISTINCT ON (s."nftId") 
            s."nftId",
            s."price"
          FROM "NFTSale" s
          ORDER BY s."nftId", s."timestamp" DESC
        ) s ON s."nftId" = n."id"
        WHERE n."ownerWallet" = ${walletAddress}
      `,

      // Get BUX balance for this wallet
      prisma.tokenBalance.findUnique({
        where: { walletAddress }
      })
    ]);

    // Update Discord IDs in a separate transaction
    await prisma.$transaction([
      // Update TokenBalance Discord ID
      prisma.tokenBalance.update({
        where: { walletAddress },
        data: { ownerDiscordId: discordId }
      }),

      // Update NFT ownership Discord IDs
      prisma.nFT.updateMany({
        where: { ownerWallet: walletAddress },
        data: { ownerDiscordId: discordId }
      }),

      // Add wallet to UserWallet if not exists
      prisma.userWallet.upsert({
        where: { address: walletAddress },
        create: {
          address: walletAddress,
          user: {
            connect: { discordId }
          }
        },
        update: {} // No update needed
      })
    ]);

    // Get linked wallets
    const linkedWallets = await prisma.tokenBalance.findMany({
      where: {
        ownerDiscordId: discordId,
        walletAddress: { not: walletAddress }
      }
    });

    console.log('NFT Query Result:', nfts);

    // Count NFTs by collection
    const collectionCounts = new Map<string, { count: number; mint: string; value: number }>();
    nfts.forEach(nft => {
      const current = collectionCounts.get(nft.collection);
      if (current) {
        collectionCounts.set(nft.collection, {
          count: current.count + 1,
          mint: current.mint,
          value: current.value + nft.price
        });
      } else {
        collectionCounts.set(nft.collection, {
          count: 1,
          mint: nft.mint,
          value: nft.price
        });
      }
    });

    // Format collections array
    const collections: CollectionCount[] = Array.from(collectionCounts.entries())
      .filter(([name]) => name in NFT_THRESHOLDS) // Only include known collections
      .map(([name, data]) => ({
        name: name as CollectionName, // Cast to known collection names
        count: data.count,
        mint: data.mint
      }));

    // Calculate totals
    const totalValue = Array.from(collectionCounts.values())
      .reduce((sum, data) => sum + data.value, 0);

    // Calculate total BUX balance across all linked wallets
    const mainBalance = BigInt(tokenBalance?.balance || 0);
    const linkedBalance = linkedWallets.reduce(
      (sum: bigint, wallet: TokenBalanceWithOwner) => sum + BigInt(wallet.balance || 0), 
      BigInt(0)
    );
    const totalBuxBalance = mainBalance + linkedBalance;

    // Convert from raw balance (with 9 decimals) to actual BUX amount
    const actualBuxBalance = Number(totalBuxBalance) / 1e9;

    console.log('BUX Balance:', {
      mainBalance: Number(mainBalance) / 1e9,
      linkedBalance: Number(linkedBalance) / 1e9,
      totalBuxBalance: actualBuxBalance,
      walletAddress,
      discordId
    });

    // Update Discord roles if discordId is provided
    let assignedRoles: string[] = [];
    if (discordId) {
      try {
        assignedRoles = await updateDiscordRoles(
          discordId, 
          collections, 
          walletAddress,
          actualBuxBalance
        );
      } catch (error) {
        console.error('Error updating Discord roles:', error);
      }
    }

    return {
      isHolder: collections.length > 0,
      collections,
      buxBalance: actualBuxBalance,
      totalNFTs: nfts.length,
      totalValue,
      assignedRoles
    };

  } catch (error) {
    console.error('Error verifying holder:', error);
    throw error;
  }
} 