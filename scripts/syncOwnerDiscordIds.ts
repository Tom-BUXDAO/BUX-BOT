import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncOwnerDiscordIds() {
    try {
        // Get all users with their wallets
        const users = await prisma.user.findMany({
            include: {
                wallets: true
            }
        });

        console.log(`Found ${users.length} users`);

        // Update TokenBalance records
        console.log('\nUpdating TokenBalance records...');
        let tokenBalanceUpdates = 0;
        for (const user of users) {
            for (const wallet of user.wallets) {
                const result = await prisma.tokenBalance.updateMany({
                    where: {
                        walletAddress: wallet.address
                    },
                    data: {
                        ownerDiscordId: user.discordId
                    }
                });
                if (result.count > 0) tokenBalanceUpdates += result.count;
            }
        }
        console.log(`Updated ${tokenBalanceUpdates} TokenBalance records`);

        // Update NFT records
        console.log('\nUpdating NFT records...');
        let nftUpdates = 0;
        for (const user of users) {
            for (const wallet of user.wallets) {
                const result = await prisma.nFT.updateMany({
                    where: {
                        ownerWallet: wallet.address
                    },
                    data: {
                        ownerDiscordId: user.discordId
                    }
                });
                if (result.count > 0) nftUpdates += result.count;
            }
        }
        console.log(`Updated ${nftUpdates} NFT records`);

        // Print summary
        console.log('\nSync Summary:');
        console.log('-------------');
        console.log(`Users: ${users.length}`);
        console.log(`Total wallets: ${users.reduce((sum, user) => sum + user.wallets.length, 0)}`);
        console.log(`TokenBalance updates: ${tokenBalanceUpdates}`);
        console.log(`NFT updates: ${nftUpdates}`);

    } catch (error) {
        console.error('Error syncing ownerDiscordIds:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

syncOwnerDiscordIds(); 