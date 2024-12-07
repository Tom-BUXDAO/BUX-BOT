import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get NFT counts grouped by discord ID and wallet
    const nftHoldings = await prisma.nFT.groupBy({
      by: ['ownerDiscordId', 'ownerAddress', 'collection'],
      _count: true,
      orderBy: {
        ownerDiscordId: 'asc'
      }
    });

    // Get collection floor prices
    const collections = await prisma.collection.findMany({
      select: {
        name: true,
        floorPrice: true
      }
    });

    const floorPrices = collections.reduce((acc, col) => {
      acc[col.name] = Number(col.floorPrice);
      return acc;
    }, {} as Record<string, number>);

    // Calculate total value per holder
    const holderValues = nftHoldings.reduce((acc, holding) => {
      const key = holding.ownerDiscordId || holding.ownerAddress;
      const value = (holding._count * (floorPrices[holding.collection] || 0)) / 1e9;
      
      if (!acc[key]) {
        acc[key] = {
          discordId: holding.ownerDiscordId,
          address: holding.ownerAddress,
          totalValue: 0,
          totalNFTs: 0,
          collections: {}
        };
      }
      
      acc[key].totalValue += value;
      acc[key].totalNFTs += holding._count;
      acc[key].collections[holding.collection] = holding._count;
      
      return acc;
    }, {} as Record<string, { 
      discordId?: string; 
      address: string;
      totalValue: number; 
      totalNFTs: number; 
      collections: Record<string, number> 
    }>);

    // Get Discord usernames for known users
    const discordIds = Object.values(holderValues)
      .map(h => h.discordId)
      .filter((id): id is string => !!id);

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

    // Create user lookup
    const userLookup = users.reduce((acc, user) => {
      acc[user.discordId] = user;
      return acc;
    }, {} as Record<string, typeof users[0]>);

    // Create final leaderboard
    const leaderboard = Object.entries(holderValues)
      .map(([key, data]) => ({
        discordId: data.discordId,
        address: data.address,
        name: data.discordId ? userLookup[data.discordId]?.name : `${data.address.slice(0, 4)}...${data.address.slice(-4)}`,
        image: data.discordId ? userLookup[data.discordId]?.image : null,
        totalValue: data.totalValue,
        totalNFTs: data.totalNFTs,
        collections: data.collections
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error getting top holders:', error);
    return res.status(500).json({ error: 'Failed to get top holders' });
  }
} 