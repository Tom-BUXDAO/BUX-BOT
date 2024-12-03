import { prisma } from '../lib/prisma';

async function syncWallets() {
  try {
    console.log('Starting wallet sync...');

    // Get all unique wallet addresses from NFTs
    const nftWallets = await prisma.nFT.findMany({
      select: { ownerWallet: true },
      distinct: ['ownerWallet']
    });

    // Get all unique wallet addresses from token balances
    const tokenWallets = await prisma.tokenBalance.findMany({
      select: { walletAddress: true },
      distinct: ['walletAddress']
    });

    // Combine unique wallet addresses
    const allWallets = new Set([
      ...nftWallets.map(w => w.ownerWallet),
      ...tokenWallets.map(w => w.walletAddress)
    ]);

    console.log(`Found ${allWallets.size} unique wallets`);

    // Get all users with Discord IDs
    const users = await prisma.user.findMany({
      where: { discordId: { not: null } },
      select: { id: true, discordId: true }
    });

    console.log(`Found ${users.length} users with Discord IDs`);

    // Create wallet connections and update ownership
    let created = 0;
    let updated = 0;

    for (const wallet of allWallets) {
      // Find NFTs for this wallet
      const nfts = await prisma.nFT.findFirst({
        where: { ownerWallet: wallet }
      });

      // Find token balance for this wallet
      const balance = await prisma.tokenBalance.findUnique({
        where: { walletAddress: wallet }
      });

      if (nfts?.ownerDiscordId || balance?.ownerDiscordId) {
        const discordId = nfts?.ownerDiscordId || balance?.ownerDiscordId;
        const user = users.find(u => u.discordId === discordId);

        if (user) {
          // Create wallet connection
          await prisma.userWallet.create({
            data: {
              address: wallet,
              userId: user.id
            }
          });
          created++;

          // Update all NFTs and token balances
          await prisma.$transaction([
            prisma.nFT.updateMany({
              where: { ownerWallet: wallet },
              data: { ownerDiscordId: user.discordId }
            }),
            prisma.tokenBalance.updateMany({
              where: { walletAddress: wallet },
              data: { ownerDiscordId: user.discordId }
            })
          ]);
          updated++;
        }
      }
    }

    console.log(`Created ${created} wallet connections`);
    console.log(`Updated ${updated} ownership records`);

  } catch (error) {
    console.error('Error syncing wallets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncWallets()
  .then(() => console.log('Sync complete'))
  .catch(console.error); 