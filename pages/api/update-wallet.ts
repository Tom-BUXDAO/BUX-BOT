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

    // Run everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete empty wallet placeholder
      await tx.userWallet.deleteMany({
        where: { 
          userId: user.id,
          address: '' 
        }
      });

      // Add new wallet
      const wallet = await tx.userWallet.create({
        data: {
          address,
          userId: user.id
        }
      });

      // Update NFT and token ownership
      await tx.nFT.updateMany({
        where: { ownerWallet: address },
        data: { ownerDiscordId: user.discordId }
      });

      await tx.tokenBalance.updateMany({
        where: { walletAddress: address },
        data: { ownerDiscordId: user.discordId }
      });

      return wallet;
    });

    console.log('Wallet connection completed:', result);

    // Run verification
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification complete:', verificationResult);
    
    return res.status(200).json({ 
      success: true,
      wallet: result,
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