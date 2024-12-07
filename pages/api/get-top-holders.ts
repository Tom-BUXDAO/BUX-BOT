import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all data in a single query with INNER JOIN for Discord users
    const [nftHoldingsData, collections] = await Promise.all([
      prisma.$queryRaw<Array<{
        ownerDiscordId: string | null;
        ownerWallet: string | null;
        collection: string;
        count: bigint;
        userName: string | null;
        userImage: string | null;
      }>>`
        WITH holdings AS (
          SELECT 
            "ownerDiscordId",
            "ownerWallet",
            collection,
            COUNT(*) as count
          FROM "NFT"
          GROUP BY "ownerDiscordId", "ownerWallet", collection
        )
        SELECT 
          h."ownerDiscordId",
          h."ownerWallet",
          h.collection,
          h.count,
          u.name as "userName",
          u.image as "userImage"
        FROM holdings h
        LEFT JOIN "User" u ON h."ownerDiscordId" = u."discordId"
        ORDER BY h.count DESC
      `,
      prisma.collection.findMany({
        select: {
          name: true,
          floorPrice: true
        }
      })
    ]);

    // Create floor price lookup
    const floorPrices = collections.reduce((acc, col) => {
      acc[col.name] = Number(col.floorPrice);
      return acc;
    }, {} as Record<string, number>);

    // Process holdings into a map
    const holdingsMap = nftHoldingsData.reduce((acc, holding) => {
      const key = holding.ownerDiscordId || holding.ownerWallet;
      if (!key) return acc;

      if (!acc[key]) {
        acc[key] = {
          discordId: holding.ownerDiscordId,
          wallet: holding.ownerWallet,
          name: holding.userName,
          image: holding.userImage,
          totalNFTs: 0,
          totalValue: 0,
          collections: {}
        };
      }

      const count = Number(holding.count);
      acc[key].totalNFTs += count;
      acc[key].collections[holding.collection] = count;
      acc[key].totalValue += (count * (floorPrices[holding.collection] || 0)) / 1e9;

      return acc;
    }, {} as Record<string, {
      discordId: string | null;
      wallet: string | null;
      name: string | null;
      image: string | null;
      totalNFTs: number;
      totalValue: number;
      collections: Record<string, number>;
    }>);

    // Create final leaderboard
    const leaderboard = Object.entries(holdingsMap)
      .map(([key, data]) => {
        if (data.discordId && data.name) {
          return {
            discordId: data.discordId,
            name: data.name,
            image: data.image,
            totalValue: data.totalValue,
            totalNFTs: data.totalNFTs,
            collections: data.collections
          };
        } else {
          const address = data.wallet || 'Unknown Wallet';
          return {
            address,
            name: `${address.slice(0, 4)}...${address.slice(-4)}`,
            image: null,
            totalValue: data.totalValue,
            totalNFTs: data.totalNFTs,
            collections: data.collections
          };
        }
      })
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error in get-top-holders:', error);
    return res.status(500).json({ 
      error: 'Failed to get top holders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 