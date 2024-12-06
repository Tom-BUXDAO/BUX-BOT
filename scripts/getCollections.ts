import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const COLLECTIONS = [
  { dbName: 'money_monsters', meSymbol: 'money_monsters' },
  { dbName: 'fcked_catz', meSymbol: 'fcked_catz' },
  { dbName: 'ai_bitbots', meSymbol: 'ai_bitbots' },
  { dbName: 'money_monsters3d', meSymbol: 'moneymonsters3d' },
  { dbName: 'celebcatz', meSymbol: 'celebcatz' },
  { dbName: 'warriors', meSymbol: 'ai_warriors' },
  { dbName: 'squirrels', meSymbol: 'ai_secret_squirrels' },
  { dbName: 'energy_apes', meSymbol: 'ai_energy_apes' },
  { dbName: 'rjctd_bots', meSymbol: 'rejected_bots_ryc' },
  { dbName: 'candy_bots', meSymbol: 'candybots' },
  { dbName: 'doodle_bot', meSymbol: 'doodlebots' }
];

async function updateCollectionInfo() {
  console.log('Updating collection info...\n');

  for (const collection of COLLECTIONS) {
    try {
      // Get Magic Eden data
      const response = await fetch(
        `https://api-mainnet.magiceden.dev/v2/collections/${collection.meSymbol}/stats`
      );
      const meData = await response.json();

      // Update using raw SQL
      await prisma.$executeRaw`
        UPDATE "Collection"
        SET "listedCount" = ${meData.listedCount || 0},
            "floorPrice" = ${BigInt(meData.floorPrice || 0)}
        WHERE name = ${collection.dbName}
      `;

      // Get updated data
      const result = await prisma.$queryRaw<any[]>`
        SELECT name, "listedCount", "floorPrice"
        FROM "Collection"
        WHERE name = ${collection.dbName}
      `;

      const updated = result[0];
      console.log(`Updated ${updated.name}:`);
      console.log(`Listed: ${updated.listedCount}`);
      console.log(`Floor Price: ${Number(updated.floorPrice) / 1e9} SOL`);
      console.log('-------------------\n');

    } catch (error) {
      console.error(`Error updating ${collection.dbName}:`, error);
    }
  }

  await prisma.$disconnect();
}

updateCollectionInfo(); 