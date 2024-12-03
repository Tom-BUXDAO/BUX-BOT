import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { updateOwnership } from '@/utils/updateOwnership';

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

    // Add wallet to user - using correct model name UserWallet
    await prisma.userWallet.upsert({
      where: {
        address: address
      },
      update: {
        userId: session.user.id
      },
      create: {
        address: address,
        userId: session.user.id
      }
    });

    // Update ownership records
    await updateOwnership(address, session.user.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 