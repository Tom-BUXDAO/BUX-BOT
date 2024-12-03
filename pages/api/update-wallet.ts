import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('\n=== Starting Wallet Connection Process ===');
    console.log(`User ID: ${userId}`);
    console.log(`Wallet Address: ${address}`);

    // Get user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    // Start a transaction for all updates
    await prisma.$transaction(async (tx) => {
      // 1. Add wallet to userWallets table
      await tx.userWallet.upsert({
        where: { address },
        create: { address, userId },
        update: { userId }
      });

      // 2. Update NFT ownership for this wallet
      await tx.nFT.updateMany({
        where: { ownerWallet: address },
        data: { ownerDiscordId: user.discordId }
      });

      // 3. Update token balance ownership for this wallet
      await tx.tokenBalance.updateMany({
        where: { walletAddress: address },
        data: { ownerDiscordId: user.discordId }
      });
    });

    // Run verification with updated data
    const verificationResult = await verifyHolder(address, user.discordId);

    return res.status(200).json({ success: true, verification: verificationResult });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 