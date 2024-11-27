import { Connection, PublicKey } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const prisma = new PrismaClient();
const BUX_MINT = new PublicKey('FMiRxSbLqRTWiBszt1DZmXd7SrscWCccY7fcXNtwWxHK');
const BUX_DECIMALS = 8;

interface TokenHolder {
    owner: string;
    amount: string;
}

// Use the same RPC setup that's working
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
console.log('Using RPC endpoint:', RPC_ENDPOINT);

const connection = new Connection(RPC_ENDPOINT, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
});

async function fetchAllTokenAccounts(): Promise<TokenHolder[]> {
    try {
        console.log('Getting all BUX token accounts...');
        
        // Get all token accounts for this mint using the working method
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(TOKEN_PROGRAM_ID),
            { mint: BUX_MINT }
        );

        console.log(`Found ${tokenAccounts.value.length} token accounts`);

        const holders = tokenAccounts.value
            .map(({ account }) => {
                const parsedInfo = account.data.parsed.info;
                return {
                    owner: parsedInfo.owner,
                    amount: parsedInfo.tokenAmount.amount
                };
            })
            .filter((holder): holder is TokenHolder => 
                Number(holder.amount) > 0
            )
            .sort((a, b) => Number(b.amount) - Number(a.amount));

        // Log top holders
        console.log('\nTop 10 BUX holders:');
        holders.slice(0, 10).forEach((holder, index) => {
            const balance = Number(holder.amount) / Math.pow(10, BUX_DECIMALS);
            console.log(`${index + 1}. ${holder.owner}: ${balance.toLocaleString()} BUX`);
        });

        return holders;

    } catch (error) {
        console.error('Error fetching token accounts:', error);
        return [];
    }
}

async function updateAllBuxHolders() {
    try {
        const holders = await fetchAllTokenAccounts();
        console.log(`\nUpdating database with ${holders.length} BUX holders`);

        // Process in smaller batches
        const batchSize = 10;
        for (let i = 0; i < holders.length; i += batchSize) {
            const batch = holders.slice(i, i + batchSize);
            console.log(`Progress: ${i + batch.length}/${holders.length} (${Math.round(((i + batch.length)/holders.length) * 100)}%)`);

            await Promise.all(batch.map(async (holder) => {
                try {
                    await prisma.tokenBalance.upsert({
                        where: { walletAddress: holder.owner },
                        create: {
                            walletAddress: holder.owner,
                            balance: Number(holder.amount),
                            lastUpdated: new Date()
                        },
                        update: {
                            balance: Number(holder.amount),
                            lastUpdated: new Date()
                        }
                    });
                } catch (error) {
                    console.error(`Error processing holder ${holder.owner}:`, error);
                }
            }));

            // Longer delay between batches
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAllBuxHolders(); 