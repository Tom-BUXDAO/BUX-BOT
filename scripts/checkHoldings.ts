import { prisma } from '../lib/prisma';

async function checkHoldings() {
  try {
    console.log('Checking holdings for user 931160720261939230...');
    
    // Check NFT counts
    const nftCounts = await prisma.nFT.groupBy({
      by: ['collection'],
      where: {
        ownerDiscordId: '931160720261939230'
      },
      _count: true
    });
    
    console.log('\nNFT Counts:');
    console.table(nftCounts);

    // Check BUX balance
    const buxBalance = await prisma.tokenBalance.aggregate({
      where: {
        ownerDiscordId: '931160720261939230'
      },
      _sum: {
        balance: true
      }
    });
    
    console.log('\nBUX Balance:', buxBalance._sum.balance);

    // Check current roles
    const roles = await prisma.roles.findUnique({
      where: { discordId: '931160720261939230' }
    });
    
    console.log('\nCurrent Roles:', roles);

  } catch (error) {
    console.error('Error checking holdings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHoldings(); 