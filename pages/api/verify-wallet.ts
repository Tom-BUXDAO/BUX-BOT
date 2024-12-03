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
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('\n=== Starting Wallet Verification ===');
    console.log('Request body:', req.body);
    console.log('User ID:', session.user.id);
    console.log('Wallet Address:', address);

    // Get user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification result:', verificationResult);

    return res.status(200).json({ 
      success: true,
      verification: verificationResult 
    });

  } catch (error: any) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ 
      error: 'Failed to verify wallet',
      details: error.message 
    });
  }
} 