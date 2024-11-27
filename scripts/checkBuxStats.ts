import { PublicKey } from '@solana/web3.js';

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
            `https://api.helius.xyz/v0/addresses/${BUX_MINT.toString()}/token-accounts?api-key=${HELIUS_API_KEY}`
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Helius API error: ${response.statusText}. Details: ${text}`);
        }

        const data = await response.json();
        
        // Map the response to our interface
        return data.filter((account: any) => account.parsed)
            .map((account: any) => ({
                owner: account.parsed.info.owner,
                amount: account.parsed.info.tokenAmount.amount
            }));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error fetching from Helius:', errorMessage);
        throw error;
    }
}

async function getBuxStats() {
    try {
        console.log('Fetching BUX token holders...');
        const holders = await fetchTokenHolders();
        console.log(`Found ${holders.length} token accounts`);

        let totalSupply = BigInt(0);
        const holderBalances = new Map<string, bigint>();

        // Process holders
        for (const holder of holders) {
            const amount = BigInt(holder.amount);
            if (amount > BigInt(0)) {
                totalSupply += amount;
                const currentBalance = holderBalances.get(holder.owner) || BigInt(0);
                holderBalances.set(holder.owner, currentBalance + amount);
            }
        }

        // Sort holders by balance
        const sortedHolders = Array.from(holderBalances.entries())
            .sort((a, b) => Number(b[1] - a[1]));

        console.log('\nBUX Token Statistics:');
        console.log('-------------------');
        console.log(`Total Supply: ${totalSupply.toString()} BUX`);
        console.log(`Number of Holders: ${holderBalances.size}`);
        
        console.log('\nTop 10 Holders:');
        console.log('-------------');
        sortedHolders.slice(0, 10).forEach(([address, balance], index) => {
            const percentage = Number(balance * BigInt(10000) / totalSupply) / 100;
            console.log(`${index + 1}. ${address}: ${balance.toString()} BUX (${percentage}%)`);
        });

        // Print distribution stats
        const top10Holdings = sortedHolders.slice(0, 10).reduce((sum, [_, balance]) => sum + balance, BigInt(0));
        const top10Percentage = Number(top10Holdings * BigInt(10000) / totalSupply) / 100;

        console.log('\nDistribution Statistics:');
        console.log('----------------------');
        console.log(`Top 10 Holders Control: ${top10Percentage}% of supply`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error fetching BUX stats:', errorMessage);
        process.exit(1);
    }
}

getBuxStats(); 