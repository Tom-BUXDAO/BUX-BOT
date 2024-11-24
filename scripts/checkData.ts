import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Collection {
  name: string;
  totalSupply: number;
  isMain: boolean;
}

interface NFT {
  id: string;
  mint: string;
  collection: string;
}

interface User {
  discordName: string;
  discordId: string;
  walletAddress: string | null;
}

async function checkData() {
  try {
    // Check Collections
    console.log('\n=== Collections ===');
    const collections = await prisma.$queryRaw<Collection[]>`SELECT * FROM "Collection"`;
    console.log(`Total Collections: ${collections.length}`);
    collections.forEach(collection => {
      console.log(`- ${collection.name}: ${collection.totalSupply} NFTs (${collection.isMain ? 'Main' : 'Collab'})`);
    });

    // Check NFTs
    console.log('\n=== NFTs ===');
    const nfts = await prisma.$queryRaw<NFT[]>`SELECT * FROM "NFT"`;
    console.log(`Total NFTs: ${nfts.length}`);
    
    // Group NFTs by collection
    const nftsByCollection = nfts.reduce((acc: {[key: string]: number}, nft) => {
      acc[nft.collection] = (acc[nft.collection] || 0) + 1;
      return acc;
    }, {});

    Object.entries(nftsByCollection).forEach(([collection, count]) => {
      console.log(`- ${collection}: ${count} NFTs`);
    });

    // Check Users
    console.log('\n=== Users ===');
    const users = await prisma.$queryRaw<User[]>`SELECT * FROM "User"`;
    console.log(`Total Users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.discordName} (${user.discordId}): ${user.walletAddress || 'No wallet'}`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 