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
    // Log request details
    console.log('\n=== Starting Wallet Verification ===');
    console.log('Request body:', req.body);

    // Check session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      console.log('No session found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('User ID:', session.user.id);

    // Validate wallet address
    const { address } = req.body;
    if (!address || typeof address !== 'string') {
      console.log('Invalid wallet address:', address);
      return res.status(400).json({ error: 'Valid wallet address is required' });
    }
    console.log('Wallet Address:', address);

    // Get Discord ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      console.log('No Discord ID found for user:', session.user.id);
      return res.status(400).json({ error: 'Discord account not connected' });
    }
    console.log('Discord ID:', user.discordId);

    // Verify wallet
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification result:', verificationResult);

    // Update user wallet if verification successful
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
      console.log('Updated user wallet');
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