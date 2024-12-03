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

    const { address } = req.body;
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Valid wallet address is required' });
    }

    console.log('\n=== Starting Wallet Verification ===');
    console.log('User ID:', session.user.id);
    console.log('Wallet Address:', address);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord account not connected' });
    }

    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification completed successfully');

    if (verificationResult.isHolder) {
      await prisma.userWallet.upsert({
        where: { address },
        create: {
          address,
          userId: session.user.id
        },
        update: {
          userId: session.user.id
        }
      });
    }

    return res.status(200).json({ 
      success: true,
      verification: verificationResult 
    });

  } catch (error) {
    console.error('Error verifying wallet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ 
      error: 'Failed to verify wallet',
      message: errorMessage
    });
  }
} 