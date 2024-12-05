import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

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

    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get user to get discordId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    // Run everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create wallet
      const wallet = await tx.userWallet.create({
        data: {
          address,
          userId: session.user.id
        }
      });

      // Update NFT ownership
      await tx.nFT.updateMany({
        where: { ownerWallet: address },
        data: { ownerDiscordId: user.discordId }
      });

      // Update token balance ownership
      await tx.tokenBalance.updateMany({
        where: { walletAddress: address },
        data: { ownerDiscordId: user.discordId }
      });

      return wallet;
    });

    return res.status(200).json({ success: true, wallet: result });

  } catch (error: any) {
    console.error('Error in update-wallet:', error);
    return res.status(500).json({ error: error.message });
  }
} 