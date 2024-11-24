import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function updateMissingOwners() {
  try {
    // Get all NFTs without owners (excluding burned)
    const nfts = await prisma.nFT.findMany({
      where: {
        ownerWallet: null,
        image: { not: null }  // Not burned
      },
      select: {
        mint: true,
        name: true,
        collection: true
      },
      orderBy: {
        collection: 'asc'
      }
    });

    console.log(`Found ${nfts.length} NFTs missing owners`);

    for (const nft of nfts) {
      try {
        console.log(`Fetching owner for ${nft.name} (${nft.mint})`);
        
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
            console.log(`Updated owner for ${nft.name} to ${data.owner}`);
          } else {
            console.log(`No owner found for ${nft.name}`);
          }
        } else if (response.status === 429) {
          console.log('Rate limited, waiting 5 seconds...');
          await delay(5000);
          continue;
        } else {
          console.log(`Error ${response.status} for ${nft.name}`);
        }

        // Add delay between requests
        await delay(500);
      } catch (error) {
        console.error(`Error updating ${nft.name}:`, error);
      }
    }

  } catch (error) {
    console.error('Error updating missing owners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMissingOwners(); 