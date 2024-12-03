import { prisma } from '../lib/prisma';

const WALLET_TO_CHECK = 'HmgZ2zXYUnpLWMRNuDQaRWWEWERL3MxZn8K1z5iU4tiq';

async function checkWalletAssets() {
  try {
    // Check NFTs
    const nfts = await prisma.nFT.findMany({
      where: {
        ownerWallet: WALLET_TO_CHECK
      },
      select: {
        name: true,
        collection: true,
        ownerDiscordId: true
      }
    });

    console.log(`\nFound ${nfts.length} NFTs for wallet ${WALLET_TO_CHECK}`);
    console.log('Sample NFTs:', nfts.slice(0, 5));

    // Check token balance
    const balance = await prisma.tokenBalance.findUnique({
      where: {
        walletAddress: WALLET_TO_CHECK
      }
    });

    console.log('\nToken balance:', balance ? Number(balance.balance) / 1_000_000_000 : 0, 'BUX');
    console.log('Owner Discord ID:', balance?.ownerDiscordId || 'None');

  } catch (error) {
    console.error('Error checking wallet assets:', error);
    throw error;
  }
}

// Run the check
checkWalletAssets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 