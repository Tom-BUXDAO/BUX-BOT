import { prisma } from '../lib/prisma';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SHYFT_API_KEY = process.env.SHYFT_API_KEY || process.env.NEXT_PUBLIC_SHYFT_API_KEY;
if (!SHYFT_API_KEY) {
  throw new Error('SHYFT_API_KEY is required');
}

// Add retry logic
async function fetchWithRetry(url: string, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'x-api-key': SHYFT_API_KEY
        }
      });
      if (response.data.success === false) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching ${url}:`, error.message);
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function populateNFTData() {
  try {
    console.log('Starting NFT data population...');

    // Get NFTs in batches
    const batchSize = 5; // Smaller batch size for testing
    let processed = 0;
    let failed = 0;

    const nfts = await prisma.nFT.findMany({
      select: {
        id: true,
        mint: true,
        collection: true
      },
      take: 20 // Start with a small sample
    });

    console.log(`Found ${nfts.length} NFTs to process`);

    for (let i = 0; i < nfts.length; i += batchSize) {
      const batch = nfts.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(nfts.length/batchSize)}`);

      for (const nft of batch) {
        try {
          console.log(`\nProcessing NFT ${nft.mint} (${nft.collection})`);

          // Get NFT data including sales history
          const nftUrl = `https://api.shyft.to/sol/v1/nft/get_details?network=mainnet-beta&token_address=${nft.mint}`;
          const nftData = await fetchWithRetry(nftUrl);
          console.log(`Found NFT data`);

          // Get current listing
          const listingUrl = `https://api.shyft.to/sol/v1/marketplace/get_listed_price?network=mainnet-beta&token_address=${nft.mint}`;
          const listingData = await fetchWithRetry(listingUrl);
          console.log(`Found listing data`);

          // Save to database
          await prisma.$transaction(async (tx) => {
            // Save sales if available
            if (nftData?.result?.activities?.length) {
              for (const activity of nftData.result.activities) {
                if (activity.type === 'SALE') {
                  await tx.nFTSale.create({
                    data: {
                      id: `${activity.signature}`,
                      nftId: nft.id,
                      price: parseFloat(activity.price),
                      currency: 'SOL',
                      marketplace: activity.source || 'unknown',
                      signature: activity.signature,
                      buyer: activity.buyer,
                      seller: activity.seller,
                      timestamp: new Date(activity.timestamp * 1000)
                    }
                  });
                }
              }
            }

            // Save listing if available
            if (listingData?.result) {
              await tx.nFTListing.upsert({
                where: { nftId: nft.id },
                create: {
                  id: `${nft.id}-${listingData.result.marketplace}`,
                  nftId: nft.id,
                  price: parseFloat(listingData.result.price),
                  currency: 'SOL',
                  marketplace: listingData.result.marketplace,
                  seller: listingData.result.seller,
                  lastUpdated: new Date()
                },
                update: {
                  price: parseFloat(listingData.result.price),
                  marketplace: listingData.result.marketplace,
                  seller: listingData.result.seller,
                  lastUpdated: new Date()
                }
              });
            }
          });

          processed++;
          console.log(`✓ Processed ${nft.mint}`);
        } catch (error) {
          failed++;
          console.error(`✗ Error processing ${nft.mint}:`, error);
        }

        // Add delay between NFTs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`\nBatch complete. Processed: ${processed}, Failed: ${failed}`);
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\nNFT data population completed');
    console.log(`Total processed: ${processed}`);
    console.log(`Total failed: ${failed}`);

  } catch (error) {
    console.error('Error in populateNFTData:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateNFTData(); 