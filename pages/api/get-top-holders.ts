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
        WITH holder_totals AS (
          SELECT 
            "ownerDiscordId",
            "ownerWallet",
            SUM(COUNT(*)) OVER (PARTITION BY COALESCE("ownerDiscordId", "ownerWallet")) as total_nfts
          FROM "NFT"
          GROUP BY "ownerDiscordId", "ownerWallet"
        ),
        holdings AS (
          SELECT 
            n."ownerDiscordId",
            n."ownerWallet",
            n.collection,
            COUNT(*) as count,
            ht.total_nfts
          FROM "NFT" n
          JOIN holder_totals ht ON 
            COALESCE(n."ownerDiscordId", n."ownerWallet") = COALESCE(ht."ownerDiscordId", ht."ownerWallet")
          GROUP BY n."ownerDiscordId", n."ownerWallet", n.collection, ht.total_nfts
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
        ORDER BY h.total_nfts DESC
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
        if (data.discordId && data.name) {  // If we have both Discord ID and name
          return {
            discordId: data.discordId,
            name: data.name,  // Use the name from the JOIN
            image: data.image,
            totalValue: data.totalValue,
            totalNFTs: data.totalNFTs,
            collections: data.collections
          };
        } else if (data.wallet) {  // Only use wallet if no Discord ID
          return {
            address: data.wallet,
            name: `${data.wallet.slice(0, 4)}...${data.wallet.slice(-4)}`,
            image: null,
            totalValue: data.totalValue,
            totalNFTs: data.totalNFTs,
            collections: data.collections
          };
        } else {
          return {
            address: 'Unknown Wallet',
            name: 'Unknown Wallet',
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