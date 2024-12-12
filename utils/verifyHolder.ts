import { prisma } from '../lib/prisma';
import { getTokenBalances } from './tokenBalances';
import { getNFTHoldings } from './nftHoldings';

export async function verifyHolder(discordId: string) {
  try {
    // Get user's wallets
    const user = await prisma.user.findUnique({
      where: { discordId },
      include: { wallets: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get all wallet addresses
    const walletAddresses = user.wallets.map(w => w.address).filter(Boolean);

    // Get token balances and NFT holdings
    const [tokenBalances, nftHoldings] = await Promise.all([
      getTokenBalances(walletAddresses),
      getNFTHoldings(walletAddresses)
    ]);

    // Update user's holdings in database
    await prisma.$transaction(async (tx) => {
      // Update token balances
      for (const address of walletAddresses) {
        await tx.tokenBalance.upsert({
          where: { walletAddress: address },
          create: {
            walletAddress: address,
            balance: 0,
            ownerDiscordId: discordId,
            lastUpdated: new Date()
          },
          update: {
            balance: tokenBalances.find((b: { walletAddress: string; amount: number }) => b.walletAddress === address)?.amount || 0,
            ownerDiscordId: discordId,
            lastUpdated: new Date()
          }
        });
      }

      // Update NFT ownerships
      for (const holding of nftHoldings) {
        await tx.nFT.update({
          where: { mint: holding.mint },
          data: {
            ownerWallet: holding.walletAddress,
            ownerDiscordId: discordId,
            lastUpdated: new Date()
          }
        });
      }
    });

    // The triggers will handle role updates
    const roles = await prisma.roles.findUnique({
      where: { discordId }
    });

    return roles;

  } catch (error) {
    console.error('Error in verifyHolder:', error);
    throw error;
  }
} 