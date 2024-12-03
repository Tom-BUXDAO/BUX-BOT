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
    if (standardBuxBalance >= Number(process.env.BUX_BANKER_THRESHOLD)) {
      assignedRoles.push(process.env.BUX_BANKER_ROLE_ID!);
    } else if (standardBuxBalance >= Number(process.env.BUX_SAVER_THRESHOLD)) {
      assignedRoles.push(process.env.BUX_SAVER_ROLE_ID!);
    } else if (standardBuxBalance >= Number(process.env.BUX_BUILDER_THRESHOLD)) {
      assignedRoles.push(process.env.BUX_BUILDER_ROLE_ID!);
    } else if (standardBuxBalance >= Number(process.env.BUX_BEGINNER_THRESHOLD)) {
      assignedRoles.push(process.env.BUX_BEGINNER_ROLE_ID!);
    }

    // Check if user has all 5 main collections
    console.log('Checking for BUXDAO 5 role eligibility:');
    console.log('Required collections:', MAIN_COLLECTIONS);
    console.log('User collections:', collectionCounts);
    
    let missingCollections = MAIN_COLLECTIONS.filter(collection => 
      !collectionCounts[collection] || collectionCounts[collection] === 0
    );
    
    console.log('Missing collections:', missingCollections);

    const hasAllMainCollections = missingCollections.length === 0;
    console.log('Has all main collections?', hasAllMainCollections);

    if (hasAllMainCollections) {
      console.log('Assigning BUXDAO 5 role');
      assignedRoles.push(process.env.BUXDAO_5_ROLE_ID!);
    }

    // Individual collection roles
    collections.forEach(({ name, count }) => {
      console.log(`Processing collection ${name} with count ${count}`);
      
      switch(name) {
        case 'money_monsters3d':
          console.log('Found Money Monsters 3D');
          assignedRoles.push(process.env.MONEY_MONSTERS3D_ROLE_ID!);
          if (count >= Number(process.env.MONEY_MONSTERS3D_WHALE_THRESHOLD)) {
            console.log('Assigning MM3D whale role');
            assignedRoles.push(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!);
          }
          break;
        case 'ai_bitbots':
          console.log('Found AI Bitbots');
          assignedRoles.push(process.env.AI_BITBOTS_ROLE_ID!);
          if (count >= Number(process.env.AI_BITBOTS_WHALE_THRESHOLD)) {
            console.log('Assigning AI Bitbots whale role');
            assignedRoles.push(process.env.AI_BITBOTS_WHALE_ROLE_ID!);
          }
          break;
        case 'candy_bots':
          assignedRoles.push(process.env.CANDY_BOTS_ROLE_ID!);
          break;
        case 'fcked_catz':
          assignedRoles.push(process.env.FCKED_CATZ_ROLE_ID!);
          if (count >= Number(process.env.FCKED_CATZ_WHALE_THRESHOLD)) {
            assignedRoles.push(process.env.FCKED_CATZ_WHALE_ROLE_ID!);
          }
          break;
        case 'squirrels':
          assignedRoles.push(process.env.SQUIRRELS_ROLE_ID!);
          break;
        case 'energy_apes':
          assignedRoles.push(process.env.ENERGY_APES_ROLE_ID!);
          break;
      }
    });

    console.log('Final assigned roles:', assignedRoles);

    // At the start of the function, log the role IDs we're using
    console.log('Role IDs from env:', {
      AI_BITBOTS_WHALE: process.env.AI_BITBOTS_WHALE_ROLE_ID,
      BUXDAO_5: process.env.BUXDAO_5_ROLE_ID,
      // ... add other role IDs
    });

    // Before assigning roles, log the collections we found
    console.log('Collections found:', collectionCounts);

    // Before returning, log which roles we're assigning and why
    console.log('Final assigned roles:', assignedRoles.map(roleId => ({
      roleId,
      reason: roleId === process.env.BUXDAO_5_ROLE_ID ? 'BUXDAO 5' :
              roleId === process.env.AI_BITBOTS_WHALE_ROLE_ID ? 'AI Bitbots Whale' :
              // ... add other role mappings
              'Unknown'
    })));

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