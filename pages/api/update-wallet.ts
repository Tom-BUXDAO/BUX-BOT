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

    // Get user first to ensure they exist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { wallets: true }
    });

    if (!user) {
      console.error('User not found:', session.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', {
      id: user.id,
      discordId: user.discordId,
      existingWallets: user.wallets.length
    });

    try {
      // Run everything in a transaction
      const result = await prisma.$transaction(async (tx) => {
        console.log('Deleting empty wallets...');
        // Delete empty wallet placeholder
        const deleted = await tx.userWallet.deleteMany({
          where: {
            userId: user.id,
            address: ''
          }
        });
        console.log('Deleted wallets:', deleted);

        console.log('Creating new wallet...');
        // Create new wallet
        const wallet = await tx.userWallet.create({
          data: {
            address,
            userId: user.id
          }
        });
        console.log('Created wallet:', wallet);

        return wallet;
      });

      console.log('Transaction completed successfully');

      // Run verification
      const verificationResult = await verifyHolder(address, user.discordId!);
      
      return res.status(200).json({ 
        success: true,
        wallet: result,
        verification: verificationResult 
      });

    } catch (txError: any) {
      console.error('Transaction error:', txError);
      throw txError;
    }

  } catch (error: any) {
    console.error('Error in update-wallet:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 