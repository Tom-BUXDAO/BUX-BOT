import { PrismaClient, User } from '@prisma/client';
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

    // First, add the new wallet to User's wallets using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "UserWallet" (id, address, "userId")
      SELECT 
        gen_random_uuid(),
        ${walletAddress},
        u.id
      FROM "User" u
      WHERE u."discordId" = ${discordId}
      ON CONFLICT (address) DO NOTHING
    `;

    // Update ownership in TokenBalance and NFT tables
    await prisma.$transaction([
      // Update TokenBalance Discord ID
      prisma.$executeRaw`
        UPDATE "TokenBalance"
        SET "ownerDiscordId" = ${discordId}
        WHERE "walletAddress" = ${walletAddress}
      `,

      // Update NFT ownership Discord IDs
      prisma.$executeRaw`
        UPDATE "NFT"
        SET "ownerDiscordId" = ${discordId}
        WHERE "ownerWallet" = ${walletAddress}
      `
    ]);

    // Get all NFTs across all user's wallets
    const userWallets = await prisma.$queryRaw<{ address: string }[]>`
      SELECT w.address
      FROM "UserWallet" w
      JOIN "User" u ON u.id = w."userId"
      WHERE u."discordId" = ${discordId}
    `;

    const walletAddresses = userWallets.map(w => w.address);

    // Get NFTs from all user's wallets
    const nfts = await prisma.$queryRaw<{ collection: string; mint: string; price: number }[]>`
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
      WHERE n."ownerWallet" = ANY(${walletAddresses}::text[])
    `;

    // Get BUX balance across all wallets
    const tokenBalances = await prisma.tokenBalance.findMany({
      where: {
        walletAddress: { in: walletAddresses }
      }
    });

    // Calculate total BUX balance
    const totalBuxBalance = tokenBalances.reduce(
      (sum, tb) => sum + BigInt(tb.balance || 0),
      BigInt(0)
    );

    // Convert from raw balance (with 9 decimals) to actual BUX amount
    const actualBuxBalance = Number(totalBuxBalance) / 1e9;

    // Group NFTs by collection and count
    const collectionCounts = nfts.reduce<CollectionCount[]>((acc, nft) => {
      const existingCollection = acc.find(c => c.name === nft.collection as CollectionName);
      if (existingCollection) {
        existingCollection.count++;
      } else {
        acc.push({
          name: nft.collection as CollectionName,
          count: 1,
          mint: nft.mint
        });
      }
      return acc;
    }, []);

    // Calculate total value
    const totalValue = nfts.reduce((sum, nft) => sum + (nft.price || 0), 0);

    console.log('BUX Balance:', {
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
          collectionCounts, 
          walletAddress,
          actualBuxBalance
        );
      } catch (error) {
        console.error('Error updating Discord roles:', error);
      }
    }

    return {
      isHolder: collectionCounts.length > 0,
      collections: collectionCounts,
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