import { prisma } from '@/lib/prisma';

async function main() {
  // Get all unique Discord IDs from NFTs
  const nftDiscordIds = await prisma.nFT.findMany({
    where: {
      ownerDiscordId: {
        not: null
      }
    },
    select: {
      ownerDiscordId: true
    },
    distinct: ['ownerDiscordId']
  });

  // Get all Discord IDs from users table
  const userDiscordIds = await prisma.user.findMany({
    select: {
      discordId: true
    }
  });

  // Find Discord IDs that exist in NFTs but not in users
  const missingDiscordIds = nftDiscordIds
    .map(nft => nft.ownerDiscordId)
    .filter(id => id !== null)
    .filter(id => !userDiscordIds.find(user => user.discordId === id));

  console.log('Found missing Discord IDs:', missingDiscordIds);

  // Print SQL to insert these users
  console.log('\nSQL to insert missing users:');
  missingDiscordIds.forEach(id => {
    console.log(`
INSERT INTO "User" ("discordId", "name", "email", "image", "createdAt", "updatedAt")
VALUES ('${id}', 'Discord User ${id}', NULL, NULL, NOW(), NOW());
    `);
  });
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 