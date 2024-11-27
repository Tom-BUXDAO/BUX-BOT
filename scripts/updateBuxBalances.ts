import { PrismaClient, Prisma } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';

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

interface Wallet {
    address: string;
}

type UserWithWallets = {
    discordId: string;
    wallets: Wallet[];
};

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
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching token holders:', error);
        throw error;
    }
}

async function updateBuxBalances() {
    try {
        // Get all users with their wallets
        const users = await prisma.$queryRaw<UserWithWallets[]>`
            SELECT u."discordId", json_agg(json_build_object('address', w."address")) as wallets
            FROM "User" u
            LEFT JOIN "UserWallet" w ON w."userId" = u.id
            GROUP BY u."discordId"
        `;

        // Create a map of wallet addresses to discord IDs
        const walletToDiscordId = new Map<string, string>();
        users.forEach(user => {
            if (Array.isArray(user.wallets)) {
                user.wallets.forEach(wallet => {
                    walletToDiscordId.set(wallet.address, user.discordId);
                });
            }
        });

        console.log('Fetching BUX token holders...');
        const holders = await fetchTokenHolders();
        console.log(`Found ${holders.length} token holders`);

        // Update token balances
        let updates = 0;
        for (const holder of holders) {
            const balanceNumber = Number(BigInt(holder.amount));
            const discordId = walletToDiscordId.get(holder.owner);

            await prisma.tokenBalance.upsert({
                where: {
                    walletAddress: holder.owner
                },
                update: {
                    balance: balanceNumber,
                    lastUpdated: new Date()
                },
                create: {
                    walletAddress: holder.owner,
                    balance: balanceNumber,
                    lastUpdated: new Date()
                }
            });
            updates++;
        }

        console.log(`Updated ${updates} token balances`);
        console.log(`With Discord ID: ${holders.filter(h => walletToDiscordId.has(h.owner)).length}`);
        console.log(`Without Discord ID: ${holders.filter(h => !walletToDiscordId.has(h.owner)).length}`);

    } catch (error) {
        console.error('Error updating BUX balances:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

updateBuxBalances(); 