import { prisma } from '../lib/prisma';

const WALLET_TO_FIX = 'HmgZ2zXYUnpLWMRNuDQaRWWEWERL3MxZn8K1z5iU4tiq';
const CORRECT_BALANCE = BigInt(20000000000); // 20 BUX

async function fixTokenBalance() {
  try {
    console.log('Fixing token balance...');

    // Update or create token balance record
    const result = await prisma.tokenBalance.upsert({
      where: {
        walletAddress: WALLET_TO_FIX
      },
      update: {
        balance: CORRECT_BALANCE,
        lastUpdated: new Date()
      },
      create: {
        walletAddress: WALLET_TO_FIX,
        balance: CORRECT_BALANCE,
        lastUpdated: new Date()
      }
    });

    console.log('Token balance updated:', {
      wallet: result.walletAddress,
      balance: Number(result.balance) / 1_000_000_000,
      lastUpdated: result.lastUpdated
    });

  } catch (error) {
    console.error('Error fixing token balance:', error);
    throw error;
  }
}

// Run the fix
fixTokenBalance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 