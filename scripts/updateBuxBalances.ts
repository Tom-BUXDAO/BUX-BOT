import { PublicKey } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// BUX token mint address
const BUX_MINT = new PublicKey('FMiRxSbLqRTWiBszt1DZmXd7SrscWCccY7fcXNtwWxHK');
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;

if (!HELIUS_API_KEY) {
    console.error('Please set HELIUS_API_KEY in your environment variables');
    process.exit(1);
}

interface TokenHolder {
    owner: string;
    amount: string;
}

async function fetchTokenHolders(): Promise<TokenHolder[]> {
    try {
        const response = await fetch(
            `https://api.helius.xyz/v0/token/holders?api-key=${HELIUS_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "mint": BUX_MINT.toString(),
                    "limit": 10000
                })
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Helius API error: ${response.statusText}. Details: ${text}`);
        }

        const data = await response.json();
        return data.holders;
    } catch (error) {
        console.error('Error fetching from Helius:', error);
        throw error;
    }
}

async function updateBuxBalances() {
    try {
        // Get all users with wallet addresses
        const users = await prisma.user.findMany({
            select: {
                id: true,
                discordId: true,
                walletAddress: true
            },
            where: {
                walletAddress: {
                    not: null
                }
            }
        });

        console.log(`Found ${users.length} users to check`);

        // Get all token holders
        console.log('Fetching BUX token holders...');
        const holders = await fetchTokenHolders();
        console.log(`Found ${holders.length} BUX holders`);

        // Create a map of wallet addresses to balances
        const balanceMap = new Map<string, bigint>();
        for (const holder of holders) {
            balanceMap.set(holder.owner, BigInt(holder.amount));
        }

        // Update user balances in batches
        const batchSize = 25;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1} (${batch.length} users)`);
            console.log(`Progress: ${i + batch.length}/${users.length} (${Math.round(((i + batch.length)/users.length) * 100)}%)`);

            await Promise.all(batch.map(async (user) => {
                try {
                    const balance = balanceMap.get(user.walletAddress!) || BigInt(0);
                    
                    if (balance > BigInt(0)) {
                        console.log(`Wallet ${user.walletAddress} has ${balance.toString()} BUX`);
                    }

                    // Update user's token balance
                    await prisma.$executeRaw`
                        UPDATE "User"
                        SET "tokenBalance" = ${balance}
                        WHERE "discordId" = ${user.discordId}
                    `;
                } catch (error) {
                    console.error(`Error processing user ${user.walletAddress}:`, error);
                }
            }));

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('Finished updating BUX balances');

    } catch (error) {
        console.error('Error updating BUX balances:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

updateBuxBalances(); 