import { prisma } from '../lib/prisma';

const WALLETS_TO_CHECK = [
  'HmgZ2zXYUnpLWMRNuDQaRWWEWERL3MxZn8K1z5iU4tiq',
  'AcWwsEwgcEHz6rzUTXcnSksFZbETtc2JhA4jF7PKjp9T'
];

async function checkAllAssets() {
  try {
    for (const wallet of WALLETS_TO_CHECK) {
      console.log(`\nChecking wallet: ${wallet}`);
      
      // Check NFTs
      const nfts = await prisma.nFT.findMany({
        where: {
          ownerWallet: wallet
        },
        select: {
          name: true,
          collection: true,
          ownerDiscordId: true
        }
      });

      console.log(`Found ${nfts.length} NFTs`);
      console.log('Collections:', [...new Set(nfts.map(nft => nft.collection))]);

      // Check token balance
      const balance = await prisma.tokenBalance.findUnique({
        where: {
          walletAddress: wallet
        }
      });

      console.log('Token balance:', balance ? Number(balance.balance) / 1_000_000_000 : 0, 'BUX');
      console.log('Owner Discord ID:', balance?.ownerDiscordId || 'None');
    }

  } catch (error) {
    console.error('Error checking assets:', error);
    throw error;
  }
}

// Run the check
checkAllAssets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 