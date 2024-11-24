import { PrismaClient } from '@prisma/client';
import { verifyHolder } from '../utils/verifyHolder';

const prisma = new PrismaClient();

async function updateNFTOwnership() {
  try {
    // Get all users with wallets
    const users = await prisma.user.findMany({
      where: {
        walletAddress: {
          not: null
        }
      }
    });

    console.log(`Found ${users.length} users with wallets`);

    for (const user of users) {
      console.log(`\nProcessing user: ${user.discordName}`);
      
      try {
        const holdings = await verifyHolder(user.walletAddress!);
        
        if (holdings.isHolder) {
          console.log(`Found ${holdings.collections.length} collections for ${user.discordName}`);
          
          // Update NFT ownership for each collection
          for (const collection of holdings.collections) {
            console.log(`Updating ownership for ${collection.name}`);
            
            await prisma.nFT.updateMany({
              where: {
                collection: collection.name,
                mint: {
                  in: holdings.collections
                    .filter(c => c.name === collection.name)
                    .map(c => c.mint)
                }
              },
              data: {
                ownerDiscordId: user.discordId,
                ownerWallet: user.walletAddress
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.discordName}:`, error);
      }
    }

  } catch (error) {
    console.error('Error updating NFT ownership:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNFTOwnership(); 