import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/utils/rateLimit';
import { verifyHolder } from '@/utils/verifyHolder';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Rate limiting
    await limiter.check(res, 10, 'CACHE_TOKEN');

    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('Starting wallet verification for:', walletAddress);

    // Create verification record
    const verification = await prisma.walletVerification.create({
      data: {
        walletAddress,
        userId: session.user.id,
        status: 'pending'
      }
    });

    // Verify holder status
    const verificationResult = await verifyHolder(walletAddress);

    // Update verification record
    await prisma.walletVerification.update({
      where: { id: verification.id },
      data: {
        status: 'completed',
        result: verificationResult
      }
    });

    return res.status(200).json(verificationResult);
  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ 
      error: 'Failed to verify wallet',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 