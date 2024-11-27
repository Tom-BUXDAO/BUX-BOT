import { PrismaClient } from '@prisma/client';
import { updateDiscordRoles } from './discordRoles';

const prisma = new PrismaClient();

interface CollectionCount {
  name: string;
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
    // Get NFTs and BUX balance in a single transaction
    const [nfts, tokenBalance] = await prisma.$transaction([
      // Get NFTs owned by this wallet with collection info
      prisma.$queryRaw<{ collection: string; mint: string; price: number }[]>`
        SELECT 
          n."collection",
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

      // Get BUX balance
      prisma.tokenBalance.findUnique({
        where: { walletAddress }
      })
    ]);

    console.log(`Found ${nfts.length} NFTs in database for wallet: ${walletAddress}`);

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
    const collections: CollectionCount[] = Array.from(collectionCounts.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      mint: data.mint
    }));

    // Calculate totals
    const totalValue = Array.from(collectionCounts.values())
      .reduce((sum, data) => sum + data.value, 0);

    // Update Discord roles if discordId is provided
    let assignedRoles: string[] = [];
    if (discordId) {
      try {
        assignedRoles = await updateDiscordRoles(discordId, collections, walletAddress);
      } catch (error) {
        console.error('Error updating Discord roles:', error);
      }
    }

    // Update token balance in database
    if (tokenBalance) {
      await prisma.tokenBalance.update({
        where: { walletAddress },
        data: { 
          balance: tokenBalance.balance,
          lastUpdated: new Date()
        }
      });
    }

    return {
      isHolder: collections.length > 0,
      collections,
      buxBalance: Number(tokenBalance?.balance || BigInt(0)),
      totalNFTs: nfts.length,
      totalValue,
      assignedRoles
    };

  } catch (error) {
    console.error('Error verifying holder:', error);
    throw error;
  }
} 