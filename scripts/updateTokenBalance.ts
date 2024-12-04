import { prisma } from '../lib/prisma';

async function updateTokenBalance() {
  try {
    const walletAddress = 'AcWwsEwgcEHz6rzUTXcnSksFZbETtc2JhA4jF7PKjp9T';
    const balance = BigInt('101026160830000'); // 101,026.16083 * 1e9

    const updated = await prisma.tokenBalance.update({
      where: { walletAddress },
      data: { balance }
    });

    console.log('Successfully updated token balance:', {
      wallet: updated.walletAddress,
      balance: Number(updated.balance) / 1e9
    });

  } catch (error) {
    console.error('Error updating token balance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTokenBalance(); 