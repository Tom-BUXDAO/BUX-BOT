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

export async function verifyHolder(walletAddress: string): Promise<{
  isHolder: boolean;
  collections: CollectionCount[];
}> {
  try {
    console.log('Starting verification for wallet:', walletAddress);
    
    // Add delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(1000); // 1 second delay

    const response = await fetch(
      `https://api.shyft.to/sol/v1/nft/read_all?network=mainnet-beta&address=${walletAddress}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_SHYFT_API_KEY || '',
        },
      }
    );

    // Handle rate limiting
    if (response.status === 429) {
      console.log('Rate limited by Shyft API, retrying after delay...');
      await delay(2000); // Wait 2 seconds before retry
      return verifyHolder(walletAddress); // Retry the request
    }

    const data = await response.json();
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
    if (error.message?.includes('rate limit')) {
      console.log('Rate limit error, retrying...');
      await delay(2000);
      return verifyHolder(walletAddress);
    }
    console.error('Error verifying holder:', error?.message || 'Unknown error');
    console.error('Full error:', error);
    return {
      isHolder: false,
      collections: []
    };
  }
} 