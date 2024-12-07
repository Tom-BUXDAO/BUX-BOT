import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get NFT counts grouped by discord ID
    const nftHoldings = await prisma.nFT.groupBy({
      by: ['ownerDiscordId'],
      _count: true,
      where: {
        ownerDiscordId: {
          not: null
        }
      }
    });

    // Get NFT counts grouped by wallet for unlinked wallets
    const walletHoldings = await prisma.nFT.groupBy({
      by: ['ownerAddress'],
      _count: true,
      where: {
        ownerDiscordId: null
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

    // Calculate total value per holder (Discord users)
    const discordHolders = await Promise.all(nftHoldings.map(async (holding) => {
      const nfts = await prisma.nFT.groupBy({
        by: ['collection'],
        where: {
          ownerDiscordId: holding.ownerDiscordId
        },
        _count: true
      });

      const totalValue = nfts.reduce((sum, nft) => 
        sum + (nft._count * (floorPrices[nft.collection] || 0)) / 1e9, 0
      );

      return {
        discordId: holding.ownerDiscordId,
        totalNFTs: holding._count,
        totalValue,
        collections: nfts.reduce((acc, nft) => {
          acc[nft.collection] = nft._count;
          return acc;
        }, {} as Record<string, number>)
      };
    }));

    // Calculate total value per wallet (unlinked wallets)
    const walletUsers = await Promise.all(walletHoldings.map(async (holding) => {
      const nfts = await prisma.nFT.groupBy({
        by: ['collection'],
        where: {
          ownerAddress: holding.ownerAddress
        },
        _count: true
      });

      const totalValue = nfts.reduce((sum, nft) => 
        sum + (nft._count * (floorPrices[nft.collection] || 0)) / 1e9, 0
      );

      return {
        address: holding.ownerAddress,
        totalNFTs: holding._count,
        totalValue,
        collections: nfts.reduce((acc, nft) => {
          acc[nft.collection] = nft._count;
          return acc;
        }, {} as Record<string, number>)
      };
    }));

    // Get Discord usernames
    const users = await prisma.user.findMany({
      where: {
        discordId: {
          in: discordHolders.map(h => h.discordId!)
        }
      },
      select: {
        discordId: true,
        name: true,
        image: true
      }
    });

    // Create final leaderboard
    const leaderboard = [
      ...discordHolders.map(holder => {
        const user = users.find(u => u.discordId === holder.discordId);
        return {
          discordId: holder.discordId,
          name: user?.name || 'Unknown User',
          image: user?.image || null,
          totalValue: holder.totalValue,
          totalNFTs: holder.totalNFTs,
          collections: holder.collections
        };
      }),
      ...walletUsers.map(holder => ({
        address: holder.address,
        name: `${holder.address.slice(0, 4)}...${holder.address.slice(-4)}`,
        image: null,
        totalValue: holder.totalValue,
        totalNFTs: holder.totalNFTs,
        collections: holder.collections
      }))
    ]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error getting top holders:', error);
    return res.status(500).json({ error: 'Failed to get top holders' });
  }
} 