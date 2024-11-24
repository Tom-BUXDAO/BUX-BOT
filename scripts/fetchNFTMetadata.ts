import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchNFTMetadata(mint: string) {
  try {
    const response = await fetch(
      `https://api.shyft.to/sol/v1/nft/read?network=mainnet-beta&token_address=${mint}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_SHYFT_API_KEY || '',
        },
      }
    );

    if (response.status === 429) {
      console.log('Rate limited, waiting 2 seconds...');
      await delay(2000);
      return fetchNFTMetadata(mint);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Failed to fetch metadata for ${mint}`);
    }

    return data.result;
  } catch (error) {
    console.error(`Error fetching metadata for ${mint}:`, error);
    return null;
  }
}

async function populateNFTMetadata() {
  const collections = await prisma.collection.findMany();
  
  for (const collection of collections) {
    console.log(`Processing collection: ${collection.name}`);
    
    const filePath = path.join(process.cwd(), 'hashlists', collection.mint_list);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const mints = JSON.parse(data);
      
      for (const mint of mints) {
        // Check if NFT already exists
        const existingNFT = await prisma.nFT.findUnique({
          where: { mint }
        });

        if (!existingNFT) {
          console.log(`Fetching metadata for ${mint}`);
          const metadata = await fetchNFTMetadata(mint);
          
          if (metadata) {
            await prisma.nFT.create({
              data: {
                mint,
                name: metadata.name,
                symbol: metadata.symbol,
                image: metadata.image_uri,
                collection: collection.name,
                attributes: metadata.attributes || {},
              }
            });
            console.log(`Added NFT: ${metadata.name}`);
          }
          
          // Add delay to avoid rate limits
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