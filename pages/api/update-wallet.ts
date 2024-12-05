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

    const userId = session.user.id;
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('\n=== Starting Wallet Connection ===');
    console.log('User ID:', userId);
    console.log('Wallet Address:', address);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallets: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    // First, delete any empty wallet placeholders
    if (user.wallets.some(w => w.address === '')) {
      await prisma.userWallet.deleteMany({
        where: { 
          userId: user.id,
          address: '' 
        }
      });
    }

    // Then add the new wallet
    const wallet = await prisma.userWallet.create({
      data: {
        address,
        userId: user.id
      }
    });

    console.log('Wallet connected:', wallet);

    // Update NFT and token ownership
    await prisma.$transaction([
      prisma.nFT.updateMany({
        where: { ownerWallet: address },
        data: { ownerDiscordId: user.discordId }
      }),
      prisma.tokenBalance.updateMany({
        where: { walletAddress: address },
        data: { ownerDiscordId: user.discordId }
      })
    ]);

    // Run verification
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification complete:', verificationResult);
    
    return res.status(200).json({ 
      success: true,
      wallet,
      verification: verificationResult 
    });

  } catch (error: any) {
    console.error('Error in update-wallet:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 