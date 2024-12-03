import { prisma } from '../lib/prisma';

async function updateNFTOwnership() {
  try {
    // First get all users
    const users = await prisma.user.findMany({
      include: {
        wallets: true
      }
    });

    console.log(`Found ${users.length} users`);

    for (const user of users) {
      console.log(`\nProcessing user ${user.discordName} (${user.discordId})`);
      console.log(`Has ${user.wallets.length} wallets`);

      // Get all NFTs owned by any of this user's wallets
      const walletAddresses = user.wallets.map(w => w.address);
      
      if (walletAddresses.length === 0) {
        console.log('No wallets found for user');
        continue;
      }

      console.log('Wallet addresses:', walletAddresses);

      // Update NFTs
      const nftUpdateResult = await prisma.nFT.updateMany({
        where: {
          ownerWallet: {
            in: walletAddresses
          },
          ownerDiscordId: null // Only update NFTs that don't have an owner set
        },
        data: {
          ownerDiscordId: user.discordId
        }
      });

      console.log(`Updated ${nftUpdateResult.count} NFTs`);

      // Update token balances
      for (const address of walletAddresses) {
        await prisma.tokenBalance.upsert({
          where: {
            walletAddress: address
          },
          update: {
            ownerDiscordId: user.discordId,
            lastUpdated: new Date()
          },
          create: {
            walletAddress: address,
            ownerDiscordId: user.discordId,
            balance: BigInt(0),
            lastUpdated: new Date()
          }
        });
      }

      console.log('Updated token balances');
    }

    console.log('\nNFT ownership update completed');
  } catch (error) {
    console.error('Error updating NFT ownership:', error);
    throw error;
  }
}

// Run the update
updateNFTOwnership()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 