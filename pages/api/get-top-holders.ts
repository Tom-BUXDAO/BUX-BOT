import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

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

    console.log('Raw NFT holdings:', nftHoldingsData);
    console.log('Collections:', collections);

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

    // Get Discord usernames for holders with discord IDs
    const discordIds = Object.values(holdingsMap)
      .map(h => h.discordId)
      .filter((id): id is string => id !== null);

    console.log('Found NFTs with Discord IDs:', discordIds);

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

    console.log('Found users in database:', users.map(u => ({
      discordId: u.discordId,
      name: u.name
    })));

    const missingDiscordIds = discordIds.filter(id => !users.find(u => u.discordId === id));
    console.log('Discord IDs missing from users table:', missingDiscordIds);

    // Create final leaderboard
    const leaderboard = Object.entries(holdingsMap)
      .map(([key, data]) => {
        if (data.discordId) {
          const user = users.find(u => u.discordId === data.discordId);
          if (!user) {
            console.log('Missing user data for holder:', {
              discordId: data.discordId,
              totalNFTs: data.totalNFTs,
              totalValue: data.totalValue
            });
          }
          return {
            discordId: data.discordId,
            name: user?.name || `Discord ID: ${data.discordId}`,
            image: user?.image || null,
            totalValue: data.totalValue,
            totalNFTs: data.totalNFTs,
            collections: data.collections
          };
        } else {
          const address = data.wallet || 'Unknown Wallet';
          return {
            address,
            name: address === 'Unknown Wallet' ? address : `${address.slice(0, 4)}...${address.slice(-4)}`,
            image: null,
            totalValue: data.totalValue,
            totalNFTs: data.totalNFTs,
            collections: data.collections
          };
        }
      })
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    console.log('Final leaderboard:', leaderboard);
    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error in get-top-holders:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return res.status(500).json({ 
      error: 'Failed to get top holders',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 