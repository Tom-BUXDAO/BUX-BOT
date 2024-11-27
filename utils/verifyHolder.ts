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
    // Get NFTs, BUX balance, and linked wallets in a single transaction
    const [nfts, tokenBalance, linkedWallets] = await prisma.$transaction([
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

      // Get BUX balance for this wallet
      prisma.tokenBalance.findUnique({
        where: { walletAddress }
      }),

      // Get all wallets linked to the same Discord ID
      prisma.$queryRaw<TokenBalanceWithOwner[]>`
        SELECT *
        FROM "TokenBalance"
        WHERE "ownerDiscordId" = ${discordId}
        AND "walletAddress" != ${walletAddress}
      `
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
    const linkedBalance = linkedWallets.reduce((sum, wallet) => sum + BigInt(wallet.balance || 0), BigInt(0));
    const totalBuxBalance = mainBalance + linkedBalance;

    // Update Discord roles if discordId is provided
    let assignedRoles: string[] = [];
    if (discordId) {
      try {
        assignedRoles = await updateDiscordRoles(
          discordId, 
          collections, 
          walletAddress,
          Number(totalBuxBalance)
        );
      } catch (error) {
        console.error('Error updating Discord roles:', error);
      }
    }

    return {
      isHolder: collections.length > 0,
      collections,
      buxBalance: Number(totalBuxBalance),
      totalNFTs: nfts.length,
      totalValue,
      assignedRoles
    };

  } catch (error) {
    console.error('Error verifying holder:', error);
    throw error;
  }
} 