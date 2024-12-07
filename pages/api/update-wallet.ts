import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { address } = req.body;
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Valid wallet address is required' });
    }

    // First check if wallet exists
    const existingWallet = await prisma.userWallet.findFirst({
      where: {
        address: address.toLowerCase()
      }
    });

    if (existingWallet) {
      // If wallet exists but belongs to another user
      if (existingWallet.userId !== session.user.id) {
        return res.status(400).json({ error: 'Wallet already connected to another user' });
      }
      // If wallet already belongs to this user, return success
      return res.status(200).json({ success: true });
    }

    // Create new wallet connection
    await prisma.userWallet.create({
      data: {
        address: address.toLowerCase(),
        userId: session.user.id
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in update-wallet:', error);
    return res.status(500).json({ error: 'Failed to update wallet' });
  }
} 