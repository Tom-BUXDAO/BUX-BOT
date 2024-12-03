import { prisma } from '@/lib/prisma';

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
        },
        ownerDiscordId: discordId // Only get NFTs that are properly linked
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
        },
        ownerDiscordId: discordId // Only get balances that are properly linked
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
    const assignedRoles: string[] = [];
    
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

    // Individual collection roles
    collections.forEach(({ name, count }) => {
      switch(name) {
        case 'money_monsters3d':
          assignedRoles.push(process.env.MONEY_MONSTERS3D_ROLE_ID!);
          if (count >= Number(process.env.MONEY_MONSTERS3D_WHALE_THRESHOLD)) {
            assignedRoles.push(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!);
          }
          break;
        case 'ai_bitbots':
          assignedRoles.push(process.env.AI_BITBOTS_ROLE_ID!);
          if (count >= Number(process.env.AI_BITBOTS_WHALE_THRESHOLD)) {
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