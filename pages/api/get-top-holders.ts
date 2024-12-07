import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

interface NFTHolding {
  ownerDiscordId: string;
  count: bigint;
}

interface WalletHolding {
  ownerAddress: string;
  count: bigint;
}

interface NFTCount {
  collection: string;
  count: bigint;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First, let's check if we have any NFTs at all
    const nftCount = await prisma.nFT.count();
    console.log('Total NFTs in database:', nftCount);

    // Get NFT counts grouped by discord ID using Prisma instead of raw SQL
    const nftHoldings = await prisma.nFT.groupBy({
      by: ['ownerDiscordId'] as const,
      _count: true,
      where: {
        ownerDiscordId: { not: null }
      }
    });
    console.log('NFT holdings by discord:', nftHoldings);

    // Get NFT counts grouped by wallet using Prisma
    const walletHoldings = await prisma.nFT.groupBy({
      by: ['ownerAddress'] as const,
      _count: true,
      where: {
        ownerDiscordId: null,
        ownerAddress: { not: null }
      }
    });
    console.log('NFT holdings by wallet:', walletHoldings);

    // Get collection floor prices
    const collections = await prisma.collection.findMany({
      select: {
        name: true,
        floorPrice: true
      }
    });
    console.log('Collections:', collections);

    const floorPrices = collections.reduce((acc, col) => {
      acc[col.name] = Number(col.floorPrice);
      return acc;
    }, {} as Record<string, number>);

    // Process Discord holders
    const discordHolders = await Promise.all(nftHoldings.map(async (holding) => {
      const nfts = await prisma.nFT.groupBy({
        by: ['collection'],
        _count: true,
        where: {
          ownerDiscordId: holding.ownerDiscordId
        }
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

    // Process wallet holders
    const walletUsers = await Promise.all(walletHoldings.map(async (holding) => {
      const nfts = await prisma.nFT.groupBy({
        by: ['collection'],
        _count: true,
        where: {
          ownerAddress: holding.ownerAddress
        }
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
          in: discordHolders.map(h => h.discordId)
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