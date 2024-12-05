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
    console.log('\n=== Wallet Connection Request ===');
    console.log('Request body:', req.body);
    console.log('Request method:', req.method);

    const session = await getServerSession(req, res, authOptions);
    console.log('Session:', {
      userId: session?.user?.id,
      discordId: session?.user?.discordId
    });

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // First delete empty wallet placeholder
    const deleted = await prisma.userWallet.deleteMany({
      where: {
        userId: session.user.id,
        address: ''
      }
    });
    console.log('Deleted empty wallets:', deleted);

    // Then create new wallet connection
    const wallet = await prisma.userWallet.create({
      data: {
        address,
        userId: session.user.id
      }
    });
    console.log('Created new wallet:', wallet);

    // Run verification
    const verificationResult = await verifyHolder(address, session.user.discordId!);
    
    return res.status(200).json({ 
      success: true,
      wallet,
      verification: verificationResult 
    });

  } catch (error: any) {
    console.error('Error in update-wallet:', error);
    return res.status(500).json({ error: error.message });
  }
} 