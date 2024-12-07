import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all data in a single query
    const [nftHoldingsData, collections] = await Promise.all([
      prisma.$queryRaw<Array<{
        ownerDiscordId: string | null;
        ownerWallet: string | null;
        collection: string;
        count: bigint;
      }>>`
        SELECT 
          "ownerDiscordId",
          "ownerWallet",
          collection,
          COUNT(*) as count
        FROM "NFT"
        GROUP BY "ownerDiscordId", "ownerWallet", collection
      `,
      prisma.collection.findMany({
        select: {
          name: true,
          floorPrice: true
        }
      })
    ]);

    // Get Discord usernames for any NFTs with Discord IDs
    const discordIds = [...new Set(nftHoldingsData
      .map(h => h.ownerDiscordId)
      .filter((id): id is string => id !== null)
    )];

    const users = await prisma.user.findMany({
      where: {
        discordId: {
          in: discordIds
        }
      },
      select: {
        discordId: true,
        name: true,
        image: true
      }
    });

    // Create lookup for Discord usernames
    const discordNames = users.reduce((acc, user) => {
      acc[user.discordId] = user.name;
      return acc;
    }, {} as Record<string, string>);

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
      totalNFTs: number;
      totalValue: number;
      collections: Record<string, number>;
    }>);

    // Create final leaderboard
    const leaderboard = Object.entries(holdingsMap)
      .map(([key, data]) => {
        if (data.discordId) {
          return {
            discordId: data.discordId,
            name: discordNames[data.discordId] || `Discord ID: ${data.discordId}`,
            image: null,
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