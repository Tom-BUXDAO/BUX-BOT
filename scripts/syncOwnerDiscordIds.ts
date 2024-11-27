import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncOwnerDiscordIds() {
    try {
        // Get all users with wallet addresses
        const users = await prisma.user.findMany({
            select: {
                discordId: true,
                walletAddress: true
            },
            where: {
                walletAddress: {
                    not: null
                }
            }
        });

        console.log(`Found ${users.length} users with wallet addresses`);

        // Update TokenBalance records
        console.log('\nUpdating TokenBalance records...');
        let tokenBalanceUpdates = 0;
        for (const user of users) {
            const result = await prisma.tokenBalance.updateMany({
                where: {
                    walletAddress: user.walletAddress!
                },
                data: {
                    ownerDiscordId: user.discordId
                }
            });
            if (result.count > 0) tokenBalanceUpdates += result.count;
        }
        console.log(`Updated ${tokenBalanceUpdates} TokenBalance records`);

        // Update NFT records
        console.log('\nUpdating NFT records...');
        let nftUpdates = 0;
        for (const user of users) {
            const result = await prisma.nFT.updateMany({
                where: {
                    ownerWallet: user.walletAddress!
                },
                data: {
                    ownerDiscordId: user.discordId
                }
            });
            if (result.count > 0) nftUpdates += result.count;
        }
        console.log(`Updated ${nftUpdates} NFT records`);

        // Print summary
        console.log('\nSync Summary:');
        console.log('-------------');
        console.log(`Users with wallets: ${users.length}`);
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