import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DELAY_BETWEEN_REQUESTS = 1000; // 1 second between requests
const MAX_RETRIES = 3;

interface CollectionData {
  name: string;
  mint_list: string;
  isMain: boolean;
  symbol?: string;
  description?: string;
}

const collections: CollectionData[] = [
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

function getCollectionPrefix(collectionName: string): string {
  const prefixes: { [key: string]: string } = {
    'money_monsters': 'Money Monster',
    'money_monsters3d': 'Money Monster 3D',
    'celebcatz': 'CelebCat',
    'fcked_catz': 'FCKED Cat',
    'ai_bitbots': 'A.I. BitBot',
    'MM_top10': 'Money Monster Top 10',
    'MM3D_top10': 'Money Monster 3D Top 10',
    'candy_bots': 'Candy Bot',
    'doodle_bot': 'Doodle Bot',
    'energy_apes': 'A.I. Energy Ape',
    'rjctd_bots': 'Rejected Bot',
    'squirrels': 'A.I. Squirrel',
    'warriors': 'A.I. Warrior'
  };
  return prefixes[collectionName] || 'Unknown';
}

async function fetchNFTMetadata(mint: string, collection: string, retryCount = 0): Promise<any> {
  try {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(`Max retries (${MAX_RETRIES}) reached for ${mint}`);
    }

    await delay(DELAY_BETWEEN_REQUESTS * (retryCount + 1));

    const response = await fetch(
      `https://api-mainnet.magiceden.dev/v2/tokens/${mint}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'User-Agent': 'BUX-DAO-Bot/1.0'
        },
        cache: 'no-store'
      }
    );

    if (response.status === 429) {
      console.log(`Rate limited (attempt ${retryCount + 1}), waiting ${DELAY_BETWEEN_REQUESTS * 2}ms...`);
      await delay(DELAY_BETWEEN_REQUESTS * 2);
      return fetchNFTMetadata(mint, collection, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched metadata for ${mint}`);
    
    // Extract number from name or generate from mint
    let number = '0';
    if (data.name) {
      const match = data.name.match(/#(\d+)/);
      if (match) number = match[1];
    } else {
      number = mint.slice(0, 4); // Use first 4 chars of mint as fallback
    }
    
    return {
      name: data.name || `${getCollectionPrefix(collection)} #${number}`,
      symbol: data.symbol,
      image_uri: data.image,
      attributes: data.attributes
    };
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying ${mint} after error: ${error?.message || 'Unknown error'}`);
      await delay(DELAY_BETWEEN_REQUESTS * (retryCount + 1));
      return fetchNFTMetadata(mint, collection, retryCount + 1);
    }
    throw error;
  }
}

async function populateNFTMetadata() {
  for (const collection of collections) {
    console.log(`Processing collection: ${collection.name}`);
    
    const filePath = path.join(process.cwd(), 'hashlists', collection.mint_list);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const mints = JSON.parse(data);
      
      for (const mint of mints) {
        const existingNFT = await prisma.nFT.findUnique({
          where: { mint }
        });

        if (!existingNFT) {
          console.log(`Fetching metadata for ${mint}`);
          const metadata = await fetchNFTMetadata(mint, collection.name);
          
          if (metadata) {
            await prisma.nFT.create({
              data: {
                mint,
                name: metadata.name,
                symbol: metadata.symbol || null,
                image: metadata.image_uri || null,
                collection: collection.name,
                attributes: metadata.attributes || {},
              }
            });
            console.log(`Added NFT: ${metadata.name}`);
          }
          
          await delay(500);
        }
      }
    } catch (error) {
      console.error(`Error processing collection ${collection.name}:`, error);
    }
  }
}

async function main() {
  try {
    await populateNFTMetadata();
    console.log('NFT metadata population completed');
  } catch (error) {
    console.error('Error populating NFT metadata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 