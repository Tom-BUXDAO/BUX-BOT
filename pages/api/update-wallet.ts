import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { createRateLimit } from '@/utils/rateLimit';
import { verifyHolder } from '@/utils/verifyHolder';
import { VerifyResult, WalletVerification } from '@/types/verification';

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const limiter = createRateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const isAllowed = await limiter.check(res, 10, 'WALLET_UPDATE');
    if (!isAllowed) return;

    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('Starting wallet verification for:', walletAddress);

    const verification = await prisma.walletVerification.create({
      data: {
        walletAddress,
        userId: session.user.id,
        status: 'pending',
        result: null
      }
    });

    const verificationResult = await verifyHolder(walletAddress);

    await prisma.walletVerification.update({
      where: { id: verification.id },
      data: {
        status: 'completed',
        result: verificationResult as unknown as Prisma.JsonValue
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