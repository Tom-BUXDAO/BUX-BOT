import { prisma } from '@/lib/prisma';

const MAIN_COLLECTIONS = [
  'money_monsters3d',
  'aibitbots',
  'candy_bots',
  'fcked_catz',
  'squirrels'
];

export async function verifyHolder(walletAddress: string, discordId: string) {
  console.log(`Starting verification for wallet ${walletAddress} and Discord ID ${discordId}`);
  
  try {
    // First get all wallets for this user
    const userWallets = await prisma.userWallet.findMany({
      where: {
        user: {
          discordId
        }
      },
      select: {
        address: true
      }
    });

    const walletAddresses = userWallets.map(w => w.address);
    console.log('Found wallets:', walletAddresses);

    // Get NFTs for all user wallets
    const nfts = await prisma.nFT.findMany({
      where: {
        ownerWallet: {
          in: walletAddresses
        }
      },
      select: {
        collection: true,
        ownerDiscordId: true
      }
    });

    console.log('Found NFTs:', nfts);

    // Get BUX balance for all wallets
    const tokenBalances = await prisma.tokenBalance.findMany({
      where: {
        walletAddress: {
          in: walletAddresses
        }
      }
    });

    const totalBuxBalance = tokenBalances.reduce((sum, tb) => sum + Number(tb.balance), 0);
    const standardBuxBalance = totalBuxBalance / 1_000_000_000;

    console.log(`Total BUX balance: ${standardBuxBalance}`);

    // Count NFTs by collection
    const collectionCounts = nfts.reduce((acc, nft) => {
      acc[nft.collection] = (acc[nft.collection] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const collections = Object.entries(collectionCounts)
      .map(([name, count]) => ({ name, count }));

    console.log('NFT collections:', collections);

    // Determine roles based on holdings
    const assignedRoles = [];
    
    // BUX balance roles
    if (standardBuxBalance >= 50000) assignedRoles.push('1095363984581984357'); // BANKER
    else if (standardBuxBalance >= 25000) assignedRoles.push('1093607187454111825'); // SAVER
    else if (standardBuxBalance >= 10000) assignedRoles.push('1093606579355525252'); // BUILDER
    else if (standardBuxBalance >= 2500) assignedRoles.push('1095034117877399686'); // BEGINNER

    // Check if user has all 5 main collections
    const hasAllMainCollections = MAIN_COLLECTIONS.every(collection => 
      collectionCounts[collection] && collectionCounts[collection] > 0
    );

    if (hasAllMainCollections) {
      assignedRoles.push('1095033899492573274'); // BUXDAO 5 role
    }

    // Individual collection roles
    collections.forEach(({ name, count }) => {
      switch(name) {
        case 'money_monsters3d':
          if (count >= 10) assignedRoles.push('1300969268665389157'); // Whale role
          break;
        case 'aibitbots':
          assignedRoles.push('1300968964276621313');
          break;
        case 'candy_bots':
          assignedRoles.push('1300969147441610773');
          break;
        case 'money_monsters':
          assignedRoles.push('1093607056696692828');
          break;
        case 'fcked_catz':
          assignedRoles.push('1093606438674382858');
          break;
        case 'squirrels':
          assignedRoles.push('1095033759612547133');
          break;
        case 'energy_apes':
          assignedRoles.push('1300968613179686943');
          break;
      }
    });

    console.log('Assigned roles:', assignedRoles);

    return {
      isHolder: nfts.length > 0 || standardBuxBalance > 0,
      collections,
      buxBalance: standardBuxBalance,
      totalNFTs: nfts.length,
      totalValue: standardBuxBalance * 0.01,
      assignedRoles
    };

  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 