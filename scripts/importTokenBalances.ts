import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parse';

const prisma = new PrismaClient();

async function importTokenBalances() {
    try {
        // First get all users with their wallets
        const users = await prisma.user.findMany({
            include: {
                wallets: true
            }
        });

        // Create a map of wallet addresses to discord IDs
        const walletToDiscordId = new Map<string, string>();
        users.forEach(user => {
            user.wallets.forEach(wallet => {
                walletToDiscordId.set(wallet.address, user.discordId);
            });
        });

        // Read the CSV file
        const csvFile = fs.readFileSync('export_token_holders_FMiRxSbLqRTWiBszt1DZmXd7SrscWCccY7fcXNtwWxHK_1732526809002.csv');
        
        // Parse CSV
        const records: any[] = [];
        const parser = csv.parse(csvFile, {
            columns: true,
            skip_empty_lines: true
        });

        for await (const record of parser) {
            records.push({
                walletAddress: record.Account,
                balance: Math.floor(parseFloat(record.Quantity) * 1e9), // Convert to smallest unit
                ownerDiscordId: walletToDiscordId.get(record.Account) || null,
                lastUpdated: new Date(),
            });
        }

        console.log(`Found ${records.length} token balances to import`);

        // Process in batches
        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (record) => {
                await prisma.tokenBalance.upsert({
                    where: {
                        walletAddress: record.walletAddress
                    },
                    update: {
                        balance: record.balance,
                        ownerDiscordId: record.ownerDiscordId,
                        lastUpdated: record.lastUpdated
                    },
                    create: record
                });
            }));

            console.log(`Processed ${Math.min(i + batchSize, records.length)}/${records.length} records`);
        }

        // Print summary
        const withDiscord = records.filter(r => r.ownerDiscordId).length;
        console.log('\nImport Summary:');
        console.log('---------------');
        console.log(`Total records: ${records.length}`);
        console.log(`With Discord ID: ${withDiscord}`);
        console.log(`Without Discord ID: ${records.length - withDiscord}`);
        console.log('\nFinished importing token balances');

    } catch (error) {
        console.error('Error importing token balances:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

importTokenBalances(); 