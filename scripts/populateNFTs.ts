import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface Collection {
  name: string;
  mint_list: string;
  isMain: boolean;
  symbol?: string;
  description?: string;
}

const collections: Collection[] = [
  // Main collections
  { name: 'money_monsters', mint_list: 'money_monsters.json', isMain: true, symbol: 'MM' },
  { name: 'money_monsters3d', mint_list: 'money_monsters3d.json', isMain: true, symbol: 'MM3D' },
  { name: 'celebcatz', mint_list: 'celebcatz.json', isMain: true, symbol: 'CC' },
  { name: 'fcked_catz', mint_list: 'fcked_catz.json', isMain: true, symbol: 'FC' },
  { name: 'ai_bitbots', mint_list: 'ai_bitbots.json', isMain: true, symbol: 'AIBB' },
  // Collab collections
  { name: 'MM_top10', mint_list: 'MM_top10.json', isMain: false },
  { name: 'MM3D_top10', mint_list: 'MM3D_top10.json', isMain: false },
  { name: 'candy_bots', mint_list: 'ai_collabs/candy_bots.json', isMain: false },
  { name: 'doodle_bot', mint_list: 'ai_collabs/doodle_bot.json', isMain: false },
  { name: 'energy_apes', mint_list: 'ai_collabs/energy_apes.json', isMain: false },
  { name: 'rjctd_bots', mint_list: 'ai_collabs/rjctd_bots.json', isMain: false },
  { name: 'squirrels', mint_list: 'ai_collabs/squirrels.json', isMain: false },
  { name: 'warriors', mint_list: 'ai_collabs/warriors.json', isMain: false }
];

async function populateCollections() {
  console.log('Starting collection population...');
  
  for (const collection of collections) {
    const filePath = path.join(process.cwd(), 'hashlists', collection.mint_list);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const hashlist = JSON.parse(data);
      
      await prisma.collection.upsert({
        where: { name: collection.name },
        update: {
          totalSupply: hashlist.length,
          symbol: collection.symbol,
          isMain: collection.isMain,
          updatedAt: new Date()
        },
        create: {
          name: collection.name,
          totalSupply: hashlist.length,
          symbol: collection.symbol,
          isMain: collection.isMain
        }
      });

      console.log(`Collection ${collection.name} added with ${hashlist.length} NFTs`);
    } catch (error) {
      console.error(`Error processing collection ${collection.name}:`, error);
    }
  }
}

async function main() {
  try {
    await populateCollections();
    console.log('Database population completed');
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 