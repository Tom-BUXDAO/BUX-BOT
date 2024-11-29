import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { createRateLimit } from '@/utils/rateLimit';
import { verifyHolder } from '@/utils/verifyHolder';
import { VerifyResult, WalletVerification } from '@/types/verification';
import { Prisma, PrismaClient } from '@prisma/client';

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Add proper typing for Prisma client with verification model
type ExtendedPrismaClient = PrismaClient & {
  verification: any;
};

const limiter = createRateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500
});

/**
 * @deprecated Use /api/verify-wallet instead
 */
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

    const client = prisma as ExtendedPrismaClient;
    const verification = await client.verification.create({
      data: {
        walletAddress,
        userId: session.user.id,
        status: 'pending',
        result: Prisma.JsonNull
      }
    });

    const verificationResult = await verifyHolder(walletAddress);

    // Convert to plain object for Prisma JSON storage
    const jsonResult = {
      isHolder: verificationResult.isHolder,
      collections: verificationResult.collections.map(c => ({
        name: c.name,
        count: c.count
      })),
      buxBalance: verificationResult.buxBalance,
      totalNFTs: verificationResult.totalNFTs,
      totalValue: verificationResult.totalValue
    };

    await client.verification.update({
      where: { id: verification.id },
      data: {
        status: 'completed',
        result: jsonResult as Prisma.InputJsonValue
      }
    });

    // Add deprecation warning header
    res.setHeader('Warning', '299 - This endpoint is deprecated. Please use /api/verify-wallet instead');
    return res.status(200).json(verificationResult);
  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ 
      error: 'Failed to verify wallet',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 