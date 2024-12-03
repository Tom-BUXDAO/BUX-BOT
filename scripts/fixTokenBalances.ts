import { prisma } from '../lib/prisma';

const WALLETS_TO_FIX = [
  {
    address: 'HmgZ2zXYUnpLWMRNuDQaRWWEWERL3MxZn8K1z5iU4tiq',
    balance: BigInt(20000000000) // 20 BUX
  },
  {
    address: 'AcWwsEwgcEHz6rzUTXcnSksFZbETtc2JhA4jF7PKjp9T',
    balance: BigInt(101026160000000) // 101,026.16 BUX
  }
];

async function fixTokenBalances() {
  try {
    console.log('Fixing token balances...');

    for (const wallet of WALLETS_TO_FIX) {
      // Update or create token balance record
      const result = await prisma.tokenBalance.upsert({
        where: {
          walletAddress: wallet.address
        },
        update: {
          balance: wallet.balance,
          lastUpdated: new Date()
        },
        create: {
          walletAddress: wallet.address,
          balance: wallet.balance,
          lastUpdated: new Date()
        }
      });

      console.log('Token balance updated:', {
        wallet: result.walletAddress,
        balance: Number(result.balance) / 1_000_000_000,
        lastUpdated: result.lastUpdated
      });
    }

  } catch (error) {
    console.error('Error fixing token balances:', error);
    throw error;
  }
}

// Run the fix
fixTokenBalances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 