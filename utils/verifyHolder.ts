import { Connection, PublicKey } from '@solana/web3.js';
import { promises as fs } from 'fs';
import path from 'path';

interface HashlistData {
  [key: string]: string[];
}

interface CollectionCount {
  name: string;
  count: number;
}

interface NFT {
  mint: string;
  name: string;
  symbol: string;
  [key: string]: any;
}

// Add delay function at the top level
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add max retries to prevent infinite loops
const MAX_RETRIES = 3;

export async function verifyHolder(
  walletAddress: string, 
  retryCount = 0
): Promise<{
  isHolder: boolean;
  collections: CollectionCount[];
}> {
  try {
    if (retryCount >= MAX_RETRIES) {
      throw new Error('Max retry attempts reached');
    }

    console.log(`Verification attempt ${retryCount + 1} for wallet:`, walletAddress);
    
    // Exponential backoff
    const backoffDelay = Math.pow(2, retryCount) * 1000;
    await delay(backoffDelay);

    const response = await fetch(
      `https://api.shyft.to/sol/v1/nft/read_all?network=mainnet-beta&address=${walletAddress}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_SHYFT_API_KEY || '',
        },
        // Add timeout and retry options
        signal: AbortSignal.timeout(30000),
        cache: 'no-store',
      }
    ).catch(error => {
      console.error('Fetch error:', error);
      throw new Error(`Network error: ${error.message}`);
    });

    if (response.status === 429) {
      console.log(`Rate limited (attempt ${retryCount + 1}), retrying after ${backoffDelay}ms...`);
      return verifyHolder(walletAddress, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json().catch(error => {
      console.error('JSON parse error:', error);
      throw new Error('Failed to parse API response');
    });

    console.log('Shyft API Response Status:', response.status);
    console.log('Shyft API Response:', JSON.stringify(data, null, 2));

    if (!data.success || !data.result) {
      console.error('Shyft API Error:', data);
      throw new Error('Failed to fetch wallet NFTs');
    }

    const ownedNFTs = data.result as NFT[];
    console.log('Found NFTs:', ownedNFTs.length);
    
    const heldCollections: CollectionCount[] = [];

    // All collections including main and collabs
    const allCollections = [
      // Main collections
      { name: 'money_monsters', mint_list: 'money_monsters.json' },
      { name: 'money_monsters3d', mint_list: 'money_monsters3d.json' },
      { name: 'celebcatz', mint_list: 'celebcatz.json' },
      { name: 'fcked_catz', mint_list: 'fcked_catz.json' },
      { name: 'ai_bitbots', mint_list: 'ai_bitbots.json' },
      // Collab collections in ai_collabs subfolder
      { name: 'MM_top10', mint_list: 'MM_top10.json' },
      { name: 'MM3D_top10', mint_list: 'MM3D_top10.json' },
      { name: 'candy_bots', mint_list: 'ai_collabs/candy_bots.json' },
      { name: 'doodle_bot', mint_list: 'ai_collabs/doodle_bot.json' },
      { name: 'energy_apes', mint_list: 'ai_collabs/energy_apes.json' },
      { name: 'rjctd_bots', mint_list: 'ai_collabs/rjctd_bots.json' },
      { name: 'squirrels', mint_list: 'ai_collabs/squirrels.json' },
      { name: 'warriors', mint_list: 'ai_collabs/warriors.json' }
    ];

    // Process each collection
    for (const collection of allCollections) {
      const filePath = path.join(process.cwd(), 'hashlists', collection.mint_list);
      try {
        console.log(`Checking collection ${collection.name} with file ${filePath}`);
        const data = await fs.readFile(filePath, 'utf8');
        const hashlist = JSON.parse(data);
        console.log(`Hashlist loaded for ${collection.name}, contains ${hashlist.length} mints`);
        
        const nftsInCollection = ownedNFTs.filter(nft => 
          hashlist.includes(nft.mint)
        );

        if (nftsInCollection.length > 0) {
          console.log(`Found ${nftsInCollection.length} NFTs in collection ${collection.name}`);
          console.log('NFT mints:', nftsInCollection.map(nft => nft.mint));
          heldCollections.push({
            name: collection.name,
            count: nftsInCollection.length
          });
        }
      } catch (error: any) {
        console.error(`Error checking collection ${collection.name}:`, error?.message || 'Unknown error');
        console.error('Full error:', error);
      }
    }

    console.log('Final held collections:', heldCollections);
    
    return {
      isHolder: heldCollections.length > 0,
      collections: heldCollections
    };
  } catch (error: any) {
    console.error(`Verification error (attempt ${retryCount + 1}):`, error);
    
    if ((error.message?.includes('rate limit') || 
         error.message?.includes('Network error') ||
         error.message?.includes('timeout')) && 
        retryCount < MAX_RETRIES) {
      console.log(`Retrying after error: ${error.message}`);
      return verifyHolder(walletAddress, retryCount + 1);
    }
    
    throw error;
  }
} 