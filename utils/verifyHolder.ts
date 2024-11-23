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
    console.log('Verifying holder for wallet:', walletAddress);
    
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

    const data = await response.json();
    console.log('Wallet NFTs response:', data);

    if (!data.success || !data.result) {
      throw new Error('Failed to fetch wallet NFTs');
    }

    const ownedNFTs = data.result as NFT[];
    const heldCollections: CollectionCount[] = [];

    // Main collections and collab collections
    const mainCollections = [
      { name: 'fcked_catz', mint_list: 'fcked_catz.json' },
      { name: 'money_monsters', mint_list: 'money_monsters.json' },
      { name: 'money_monsters3d', mint_list: 'money_monsters3d.json' },
      { name: 'celebcatz', mint_list: 'celebcatz.json' },
      { name: 'ai_bitbots', mint_list: 'ai_bitbots.json' },
      { name: 'MM_top10', mint_list: 'MM_top10.json' },
      { name: 'MM3D_top10', mint_list: 'MM3D_top10.json' },
      { name: 'candy_bots', mint_list: 'candy_bots.json' },
      { name: 'doodle_bot', mint_list: 'doodle_bot.json' },
      { name: 'energy_apes', mint_list: 'energy_apes.json' },
      { name: 'rjctd_bots', mint_list: 'rjctd_bots.json' },
      { name: 'squirrels', mint_list: 'squirrels.json' },
      { name: 'warriors', mint_list: 'warriors.json' }
    ];

    // Process each collection
    for (const collection of mainCollections) {
      const filePath = path.join(process.cwd(), 'hashlists', collection.mint_list);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const hashlist = JSON.parse(data);
        
        const nftsInCollection = ownedNFTs.filter(nft => 
          hashlist.includes(nft.mint)
        );

        if (nftsInCollection.length > 0) {
          console.log(`Found ${nftsInCollection.length} NFTs from collection: ${collection.name}`);
          heldCollections.push({
            name: collection.name,
            count: nftsInCollection.length
          });
        }
      } catch (error) {
        console.error(`Error checking collection ${collection.name}:`, error);
      }
    }

    console.log('Held collections:', heldCollections);
    
    return {
      isHolder: heldCollections.length > 0,
      collections: heldCollections
    };
  } catch (error) {
    console.error('Error verifying holder:', error);
    return {
      isHolder: false,
      collections: []
    };
  }
} 