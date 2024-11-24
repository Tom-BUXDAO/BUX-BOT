import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const BATCH_SIZE = 50;
const DELAY_BETWEEN_REQUESTS = 100;

async function updateNFTOwners() {
  try {
    // Get total count of NFTs without owners
    const totalCount = await prisma.nFT.count({
      where: {
        ownerWallet: null
      }
    });

    console.log(`Found ${totalCount} NFTs without owners`);

    // Process in batches
    let processed = 0;
    while (processed < totalCount) {
      const nfts = await prisma.nFT.findMany({
        where: {
          ownerWallet: null
        },
        select: {
          mint: true,
          collection: true,
          name: true
        },
        take: BATCH_SIZE,
        skip: processed
      });

      console.log(`\nProcessing batch ${processed/BATCH_SIZE + 1} (${nfts.length} NFTs)`);

      for (const nft of nfts) {
        try {
          const response = await fetch(
            `https://api-mainnet.magiceden.dev/v2/tokens/${nft.mint}`,
            {
              headers: {
                'accept': 'application/json',
                'User-Agent': 'BUX-DAO-Bot/1.0'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.owner) {
              await prisma.nFT.update({
                where: { mint: nft.mint },
                data: {
                  ownerWallet: data.owner,
                  lastUpdated: new Date()
                }
              });
              console.log(`Updated owner for ${nft.name} (${nft.mint}) to ${data.owner}`);
            }
          } else if (response.status === 404) {
            console.log(`NFT not found on Magic Eden: ${nft.name} (${nft.mint})`);
          } else if (response.status === 429) {
            console.log('Rate limited, waiting longer...');
            await delay(DELAY_BETWEEN_REQUESTS * 10);
            continue;
          }

          await delay(DELAY_BETWEEN_REQUESTS);
        } catch (error) {
          console.error(`Error updating ${nft.mint}:`, error);
        }
      }

      processed += nfts.length;
      console.log(`Progress: ${processed}/${totalCount} (${Math.round(processed/totalCount * 100)}%)`);
    }

  } catch (error) {
    console.error('Error updating NFT owners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNFTOwners(); 