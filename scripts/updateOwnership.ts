import { PrismaClient } from '@prisma/client';
import { Connection, PublicKey } from '@solana/web3.js';

const prisma = new PrismaClient();

async function updateOwnership() {
    try {
        // Get all users with their wallets
        const users = await prisma.user.findMany({
            include: {
                wallets: true
            }
        });

        console.log(`Found ${users.length} users`);

        // Update NFT ownership for each wallet
        let updates = 0;
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
                if (result.count > 0) {
                    updates += result.count;
                    console.log(`Updated ${result.count} NFTs for wallet ${wallet.address}`);
                }
            }
        }

        console.log(`\nUpdate Summary:`);
        console.log(`--------------`);
        console.log(`Total users: ${users.length}`);
        console.log(`Total wallets: ${users.reduce((sum, user) => sum + user.wallets.length, 0)}`);
        console.log(`Total NFT updates: ${updates}`);

    } catch (error) {
        console.error('Error updating NFT ownership:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

updateOwnership(); 