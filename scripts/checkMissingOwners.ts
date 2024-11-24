import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkMissingOwners() {
  try {
    // Get just the 2 specific NFTs
    const missingOwners = await prisma.nFT.findMany({
      where: {
        mint: {
          in: [
            '9t1uGWdPRm4ZCmbDJBW6T8XS4dmv8d8EpRpJvv9U5Gyg',  // Fcked Cat #1329
            'C2PjMQgfSJxhCykys8SMJfjtKFDRAczx33VUK8Ayh6BB'   // Fcked Cat #1906
          ]
        }
      },
      select: {
        mint: true,
        name: true,
        collection: true
      }
    });

    console.log(`\nChecking ${missingOwners.length} specific NFTs:`);
    
    for (const nft of missingOwners) {
      console.log(`\nChecking ${nft.name} (${nft.mint})`);
      
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
            console.log(`Updated owner to ${data.owner}`);
          }
        }

        await delay(500); // Rate limiting
      } catch (error) {
        console.error(`Error updating ${nft.mint}:`, error);
      }
    }

  } catch (error) {
    console.error('Error checking missing owners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingOwners(); 